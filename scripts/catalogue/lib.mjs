// Shared helpers for the catalogue import pipeline (scripts/catalogue/*.mjs).
// Conservative, resumable, cache-first HTTP + image processing utilities.
// No personal/user identifying data is ever sent in outbound requests.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const dataDir = path.join(root, 'data');
export const cacheDir = path.join(dataDir, 'catalogue-cache');
export const publicCatalogueDir = path.join(root, 'public', 'catalogue', 'real');
export const itemsPath = path.join(dataDir, 'catalogue-items.json');
export const USER_AGENT = 'heyTwin-catalogue-importer/0.1 (+local hackathon demo tool; run manually, not a continuous crawler)';

export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }

export function slugify(value) {
  return String(value).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'item';
}

export function shortHash(value, length = 8) {
  return crypto.createHash('sha256').update(value).digest('hex').slice(0, length);
}

export function sha256File(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function loadJson(filePath, fallback) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch { return fallback; }
}

export function saveJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n');
}

// ---- catalogue-items.json store -------------------------------------------------

export function loadItems() {
  return loadJson(itemsPath, []);
}

export function saveItems(items) {
  saveJson(itemsPath, items);
}

export function upsertItem(items, item) {
  const index = items.findIndex(existing => existing.id === item.id);
  if (index === -1) items.push(item); else items[index] = { ...items[index], ...item };
  return items;
}

export function findByImageHash(items, hash) {
  return items.find(item => item.image_hash === hash);
}

export function findBySourcePage(items, sourcePage) {
  return items.find(item => item.source_page === sourcePage);
}

// ---- robots.txt -------------------------------------------------------------

const robotsCache = new Map();

function parseRobots(text) {
  const groups = [];
  let current = null;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;
    const [, key, value] = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/) || [];
    if (!key) continue;
    const k = key.toLowerCase();
    if (k === 'user-agent') {
      if (!current || current.rules.length) { current = { agents: [value.toLowerCase()], rules: [] }; groups.push(current); }
      else current.agents.push(value.toLowerCase());
    } else if (current && (k === 'allow' || k === 'disallow')) {
      current.rules.push({ type: k, path: value });
    }
  }
  return groups;
}

async function getRobots(origin, fetchImpl) {
  if (robotsCache.has(origin)) return robotsCache.get(origin);
  let groups = [];
  try {
    const response = await fetchImpl(`${origin}/robots.txt`, { headers: { 'user-agent': USER_AGENT } });
    if (response.ok) groups = parseRobots(await response.text());
  } catch { /* treat unreachable robots.txt as no rules found */ }
  robotsCache.set(origin, groups);
  return groups;
}

export async function isAllowedByRobots(url, fetchImpl = fetch) {
  const target = new URL(url);
  const groups = await getRobots(target.origin, fetchImpl);
  if (!groups.length) return true;
  const ua = 'heytwin-catalogue-importer';
  const group = groups.find(g => g.agents.some(a => a !== '*' && ua.includes(a))) || groups.find(g => g.agents.includes('*'));
  if (!group) return true;
  let best = null;
  for (const rule of group.rules) {
    if (!rule.path) { if (rule.type === 'disallow') continue; }
    if (rule.path && !target.pathname.startsWith(rule.path.split('*')[0])) continue;
    const length = (rule.path || '').length;
    if (!best || length > best.length || (length === best.length && rule.type === 'allow')) best = { length, type: rule.type };
  }
  return !best || best.type === 'allow';
}

// ---- rate-limited, cached, retried fetch ------------------------------------

const lastRequestAtByHost = new Map();
const MIN_INTERVAL_MS = 6000;

async function throttle(hostname) {
  const last = lastRequestAtByHost.get(hostname) || 0;
  const wait = last + MIN_INTERVAL_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastRequestAtByHost.set(hostname, Date.now());
}

function cachePathFor(dir, url) {
  return path.join(dir, `${shortHash(url, 16)}.cache.json`);
}

// Cached GET for text/HTML pages. Returns { status, body, fromCache, url }.
// Respects robots.txt, rate-limits per host, retries transient failures a bounded number of times.
export async function cachedGetText(url, { cacheSubdir = 'pages', ttlMs = 30 * 24 * 60 * 60 * 1000, timeoutMs = 15000, retries = 2, fetchImpl = fetch, log = () => {} } = {}) {
  const dir = path.join(cacheDir, cacheSubdir);
  ensureDir(dir);
  const cacheFile = cachePathFor(dir, url);
  const cached = loadJson(cacheFile, null);
  if (cached && Date.now() - cached.fetchedAt < ttlMs) return { ...cached, fromCache: true };
  if (!(await isAllowedByRobots(url, fetchImpl))) {
    log({ event: 'robots-disallowed', url });
    return { status: 0, body: '', fromCache: false, blocked: true, url };
  }
  await throttle(new URL(url).hostname);
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchImpl(url, { redirect: 'follow', signal: AbortSignal.timeout(timeoutMs), headers: { 'user-agent': USER_AGENT, accept: 'text/html,*/*' } });
      const body = await response.text();
      const result = { status: response.status, body, fetchedAt: Date.now(), url };
      if (response.status === 200) saveJson(cacheFile, result);
      return { ...result, fromCache: false };
    } catch (error) {
      lastError = error;
      log({ event: 'fetch-retry', url, attempt, error: error.message });
      if (attempt < retries) await sleep(1000 * (attempt + 1));
    }
  }
  log({ event: 'fetch-failed', url, error: lastError?.message });
  return { status: 0, body: '', fromCache: false, error: lastError?.message, url };
}

// Cached GET for binary data (images). Returns { status, buffer, fromCache, url }.
export async function cachedGetBinary(url, { cacheSubdir = 'originals', timeoutMs = 30000, retries = 3, fetchImpl = fetch, log = () => {} } = {}) {
  const dir = path.join(cacheDir, cacheSubdir);
  ensureDir(dir);
  const file = path.join(dir, shortHash(url, 20));
  const metaFile = `${file}.json`;
  const meta = loadJson(metaFile, null);
  if (meta && fs.existsSync(file)) return { status: 200, buffer: fs.readFileSync(file), fromCache: true, url, contentType: meta.contentType };
  if (!(await isAllowedByRobots(url, fetchImpl))) {
    log({ event: 'robots-disallowed', url });
    return { status: 0, buffer: null, fromCache: false, blocked: true, url };
  }
  let lastError, lastStatus;
  for (let attempt = 0; attempt <= retries; attempt++) {
    await throttle(new URL(url).hostname);
    try {
      const response = await fetchImpl(url, { redirect: 'follow', signal: AbortSignal.timeout(timeoutMs), headers: { 'user-agent': USER_AGENT } });
      if (!response.ok) {
        lastStatus = response.status;
        const retryable = response.status === 429 || response.status >= 500;
        log({ event: 'fetch-retry', url, attempt, status: response.status });
        if (retryable && attempt < retries) {
          const retryAfter = Number(response.headers.get('retry-after'));
          await sleep(retryAfter > 0 ? retryAfter * 1000 : 1500 * (attempt + 1));
          continue;
        }
        return { status: response.status, buffer: null, fromCache: false, url };
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(file, buffer);
      saveJson(metaFile, { url, contentType: response.headers.get('content-type') || '', fetchedAt: Date.now() });
      return { status: 200, buffer, fromCache: false, url, contentType: response.headers.get('content-type') || '' };
    } catch (error) {
      lastError = error;
      log({ event: 'fetch-retry', url, attempt, error: error.message });
      if (attempt < retries) await sleep(1500 * (attempt + 1));
    }
  }
  log({ event: 'fetch-failed', url, error: lastError?.message, status: lastStatus });
  return { status: lastStatus || 0, buffer: null, fromCache: false, error: lastError?.message, url };
}

// ---- license allowlist --------------------------------------------------------

// Only reuse-permitting, derivative-permitting licenses. NC (non-commercial-only)
// and ND (no-derivatives) marks are deliberately excluded: preview generation pads/
// resizes the image, which is a derivative, and the demo may be shown publicly.
export const ALLOWED_LICENSES = {
  'cc0-1.0': 'CC0 1.0 (Public Domain Dedication)',
  'pd': 'Public domain',
  'cc-by-2.0': 'CC BY 2.0',
  'cc-by-2.5': 'CC BY 2.5',
  'cc-by-3.0': 'CC BY 3.0',
  'cc-by-4.0': 'CC BY 4.0',
  'cc-by-sa-2.0': 'CC BY-SA 2.0',
  'cc-by-sa-2.5': 'CC BY-SA 2.5',
  'cc-by-sa-3.0': 'CC BY-SA 3.0',
  'cc-by-sa-4.0': 'CC BY-SA 4.0',
};

// ---- image validation + consistent preview generation -------------------------

export async function validateAndProcessImage(buffer, { minDimension = 250 } = {}) {
  const { default: sharp } = await import('sharp');
  let metadata;
  try { metadata = await sharp(buffer).metadata(); } catch { return { ok: false, reason: 'undecodable' }; }
  if (!metadata.width || !metadata.height) return { ok: false, reason: 'undecodable' };
  if (metadata.width < minDimension || metadata.height < minDimension) return { ok: false, reason: 'too-small', width: metadata.width, height: metadata.height };
  const background = { r: 244, g: 241, b: 233, alpha: 1 }; // matches the app's cream palette (#f3efe7)
  const preview = await sharp(buffer).rotate().resize(1000, 1000, { fit: 'contain', background }).flatten({ background }).jpeg({ quality: 90 }).toBuffer();
  const thumbnail = await sharp(buffer).rotate().resize(360, 360, { fit: 'contain', background }).flatten({ background }).jpeg({ quality: 85 }).toBuffer();
  return { ok: true, width: metadata.width, height: metadata.height, format: metadata.format, preview, thumbnail };
}

export function writeCatalogueImage(id, preview, thumbnail, dir = publicCatalogueDir) {
  ensureDir(dir);
  ensureDir(path.join(dir, 'thumbs'));
  fs.writeFileSync(path.join(dir, `${id}.jpg`), preview);
  fs.writeFileSync(path.join(dir, 'thumbs', `${id}.jpg`), thumbnail);
  const isDefaultDir = dir === publicCatalogueDir;
  return { image_ref: isDefaultDir ? `/catalogue/real/${id}.jpg` : path.join(dir, `${id}.jpg`), thumbnail_ref: isDefaultDir ? `/catalogue/real/thumbs/${id}.jpg` : path.join(dir, 'thumbs', `${id}.jpg`) };
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

// ---- run log (accepted/skipped/duplicate/failed) for the import report --------

export function newRunLog() {
  return { started_at: new Date().toISOString(), events: [] };
}
export function record(runLog, outcome, detail) {
  runLog.events.push({ outcome, ...detail });
}

const runLogPath = path.join(cacheDir, 'run-log.json');

export function appendRunLog(name, runLog) {
  const log = loadJson(runLogPath, []);
  log.push({ name, finished_at: new Date().toISOString(), ...runLog });
  saveJson(runLogPath, log);
}

export function loadRunLogs() {
  return loadJson(runLogPath, []);
}
