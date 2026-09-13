#!/usr/bin/env node
// Wikimedia Commons importer. Two phases, both cache-first and resumable:
//
//   discover  reads data/sources.json's wikimedia_commons_categories, lists candidate
//             File: pages, checks each one's licence, and saves a small review thumbnail
//             to data/catalogue-cache/commons/review/ plus an entry in candidates.json.
//             Nothing here becomes part of the live catalogue.
//
//   import    reads data/sources.json's wikimedia_commons_files (files a human has
//             looked at and annotated with reviewed:true plus real attributes) and
//             promotes each into data/catalogue-items.json + public/catalogue/real/,
//             fetching the full-resolution original only at this stage.
//
// Only /wiki/Category: and /wiki/File: pages are fetched from commons.wikimedia.org —
// /w/api.php and /api/ are Disallow'd for generic crawlers in that host's robots.txt.
// Image bytes come from upload.wikimedia.org, whose robots.txt allows current files.
import path from 'node:path';
import {
  cacheDir, dataDir, loadJson, saveJson, loadItems, saveItems, upsertItem, findByImageHash, findBySourcePage,
  slugify, shortHash, sha256File, ensureDir, validateAndProcessImage, writeCatalogueImage, today, newRunLog, record, sleep,
} from './lib.mjs';
import { commonsCategoryUrl, commonsFileUrl, extractFileLinksFromCategoryHtml, extractFullResImageUrl, extractAuthor, extractTitle, extractLicense } from './commons.mjs';
import { cachedGetText, cachedGetBinary } from './lib.mjs';

const sourcesPath = path.join(dataDir, 'sources.json');
const candidatesPath = path.join(cacheDir, 'commons', 'candidates.json');
const reviewDir = path.join(cacheDir, 'commons', 'review');
const SOURCE_NAME = 'Wikimedia Commons';

function loadSources() { return loadJson(sourcesPath, {}); }

async function discover() {
  const sources = loadSources();
  const categories = sources.wikimedia_commons_categories || [];
  if (!categories.length) { console.log('No wikimedia_commons_categories configured in data/sources.json — nothing to discover.'); return; }
  ensureDir(reviewDir);
  const candidates = loadJson(candidatesPath, []);
  const byTitle = new Map(candidates.map(c => [c.title, c]));
  const runLog = newRunLog();

  for (const source of categories) {
    console.log(`\n[discover] ${source.category}`);
    const categoryPage = await cachedGetText(commonsCategoryUrl(source.category), { cacheSubdir: 'commons/pages', log: e => console.log('  ', e.event, e.url || '') });
    if (categoryPage.blocked) { record(runLog, 'skipped', { reason: 'robots-disallowed', source: source.category }); console.log('  blocked by robots.txt, skipping'); continue; }
    if (categoryPage.status !== 200) { record(runLog, 'failed', { reason: `http-${categoryPage.status}`, source: source.category }); console.log(`  fetch failed (status ${categoryPage.status})`); continue; }
    const titles = extractFileLinksFromCategoryHtml(categoryPage.body)
      .filter(title => /\.(jpe?g|png|webp)$/i.test(title))
      .slice(0, source.max_items || 20);
    console.log(`  ${titles.length} raster file candidates`);

    for (const title of titles) {
      if (byTitle.has(title)) { console.log(`  [cached] ${title}`); continue; }
      const sourcePage = commonsFileUrl(title);
      const filePage = await cachedGetText(sourcePage, { cacheSubdir: 'commons/pages', log: e => console.log('  ', e.event, e.url || '') });
      if (filePage.status !== 200) { record(runLog, 'failed', { reason: `http-${filePage.status}`, source: title }); continue; }
      const license = extractLicense(filePage.body);
      const fullResUrl = extractFullResImageUrl(filePage.body);
      const entry = {
        title, sourcePage, target_category: source.target_category, subcategory_hint: source.subcategory_hint || '',
        category_source: source.category, license: license?.label || null, license_url: license?.url || null,
        author: extractAuthor(filePage.body), page_title: extractTitle(filePage.body), fullResUrl,
        review_thumb: null, status: 'pending_review',
      };
      if (!license) { entry.status = 'rejected'; entry.reason = 'no-recognized-reuse-licence'; record(runLog, 'skipped', { reason: entry.reason, source: title }); }
      else if (!fullResUrl) { entry.status = 'rejected'; entry.reason = 'no-full-resolution-url-found'; record(runLog, 'failed', { reason: entry.reason, source: title }); }
      else {
        // Downloads the same full-resolution original that `import` will later reuse from
        // cache (cacheSubdir 'originals' matches import's), then makes a small local
        // review copy — constructing Commons' own /thumb/ URLs is unreliable for titles
        // with punctuation, so this avoids that entirely.
        const image = await cachedGetBinary(fullResUrl, { cacheSubdir: 'originals', log: e => console.log('  ', e.event, e.url || '') });
        if (image.status === 200 && image.buffer) {
          try {
            const { default: sharp } = await import('sharp');
            const reviewPath = path.join(reviewDir, `${slugify(title)}-${shortHash(sourcePage, 6)}.jpg`);
            await sharp(image.buffer).rotate().resize(400, 400, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 82 }).toFile(reviewPath);
            entry.review_thumb = reviewPath;
            record(runLog, 'accepted', { stage: 'discover', source: title });
          } catch { entry.status = 'rejected'; entry.reason = 'undecodable'; record(runLog, 'failed', { reason: entry.reason, source: title }); }
        } else { entry.status = 'rejected'; entry.reason = 'image-download-failed'; record(runLog, 'failed', { reason: entry.reason, source: title }); }
      }
      candidates.push(entry);
      byTitle.set(title, entry);
      saveJson(candidatesPath, candidates); // persist after every item so discover is safely interruptible
    }
  }
  const reviewable = candidates.filter(c => c.status === 'pending_review');
  console.log(`\nDiscovery complete. ${reviewable.length} candidates awaiting human review in ${candidatesPath}`);
  console.log('Review the images in data/catalogue-cache/commons/review/, then add the good ones to');
  console.log('data/sources.json -> wikimedia_commons_files with reviewed:true and real attributes.');
  return runLog;
}

async function importFiles() {
  const sources = loadSources();
  const fileEntries = (sources.wikimedia_commons_files || []).filter(entry => entry.reviewed);
  const items = loadItems();
  const runLog = newRunLog();
  if (!fileEntries.length) { console.log('No reviewed wikimedia_commons_files entries in data/sources.json — nothing to import.'); return { runLog, items }; }

  for (const entry of fileEntries) {
    const sourcePage = commonsFileUrl(entry.title);
    const label = entry.name || entry.title;
    const existing = findBySourcePage(items, sourcePage);
    if (existing && existing.review_status === 'approved') { console.log(`[skip-duplicate] ${label} (already imported as ${existing.id})`); record(runLog, 'duplicate', { reason: 'already-imported', source: sourcePage }); continue; }

    const filePage = await cachedGetText(sourcePage, { cacheSubdir: 'commons/pages', log: e => console.log('  ', e.event, e.url || '') });
    if (filePage.status !== 200) { console.log(`[failed] ${label}: file page HTTP ${filePage.status}`); record(runLog, 'failed', { reason: `http-${filePage.status}`, source: sourcePage }); continue; }
    const license = extractLicense(filePage.body);
    if (!license) { console.log(`[skip] ${label}: no recognized reuse-permitting licence`); record(runLog, 'skipped', { reason: 'no-recognized-reuse-licence', source: sourcePage }); continue; }
    const fullResUrl = extractFullResImageUrl(filePage.body);
    if (!fullResUrl) { console.log(`[failed] ${label}: could not resolve full-resolution image URL`); record(runLog, 'failed', { reason: 'no-full-resolution-url-found', source: sourcePage }); continue; }

    const image = await cachedGetBinary(fullResUrl, { cacheSubdir: 'originals', log: e => console.log('  ', e.event, e.url || '') });
    if (image.status !== 200 || !image.buffer) { console.log(`[failed] ${label}: image download HTTP ${image.status}`); record(runLog, 'failed', { reason: `image-http-${image.status}`, source: sourcePage }); continue; }

    const hash = sha256File(image.buffer);
    const dupe = findByImageHash(items, hash);
    if (dupe && dupe.id !== undefined) { console.log(`[skip-duplicate] ${label}: identical image already catalogued as ${dupe.id}`); record(runLog, 'duplicate', { reason: 'identical-image-hash', source: sourcePage, existing: dupe.id }); continue; }

    const processed = await validateAndProcessImage(image.buffer);
    if (!processed.ok) { console.log(`[failed] ${label}: ${processed.reason}`); record(runLog, 'failed', { reason: processed.reason, source: sourcePage }); continue; }

    const id = `${entry.target_category}-${slugify(entry.subcategory || 'item')}-${shortHash(sourcePage, 6)}`;
    const { image_ref, thumbnail_ref } = writeCatalogueImage(id, processed.preview, processed.thumbnail);
    const description = [entry.colour_primary, entry.pattern && entry.pattern !== 'solid' ? entry.pattern : '', entry.subcategory].filter(Boolean).join(' ') || label;

    const item = {
      id, name: entry.name || label, category: entry.target_category, subcategory: entry.subcategory || '',
      colour_primary: entry.colour_primary || '', colour_secondary: entry.colour_secondary || '', pattern: entry.pattern || '',
      description, style_tags: entry.style_tags || [], occasion_tags: entry.occasion_tags || [], fit: entry.fit || '',
      image_type: entry.image_type || '', image_local: `public${image_ref}`, thumbnail_local: `public${thumbnail_ref}`,
      image_ref, thumbnail_ref, source_page: sourcePage, source_image_url: fullResUrl, source_name: SOURCE_NAME,
      brand: '', retrieved_at: today(), permission_basis: license.label, license_url: license.url,
      attribution: `${extractAuthor(filePage.body) || 'Wikimedia Commons contributor'}, via Wikimedia Commons (${license.label})`,
      provenance: 'manual_review', review_status: 'approved', active: true, image_hash: hash,
      dimensions: { width: processed.width, height: processed.height },
    };
    upsertItem(items, item);
    saveItems(items);
    console.log(`[accepted] ${label} -> ${id}`);
    record(runLog, 'accepted', { source: sourcePage, id });
    await sleep(200);
  }
  return { runLog, items };
}

const mode = process.argv[2];
if (mode === 'discover') await discover();
else if (mode === 'import' || !mode) await importFiles();
else { console.error(`Unknown mode "${mode}". Use: discover | import`); process.exitCode = 1; }
