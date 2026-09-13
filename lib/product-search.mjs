import { isIP } from 'node:net';

const SERPAPI_ENDPOINT = 'https://serpapi.com/search';
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 100;
const DEFAULT_REQUEST_TIMEOUT_MS = 60_000;
const MIN_REQUEST_TIMEOUT_MS = 10_000;
const MAX_REQUEST_TIMEOUT_MS = 90_000;
const MAX_ATTRIBUTE_LENGTH = 80;
const MAX_RESPONSE_BYTES = 1_000_000;

const GARMENT_TERMS = {
  jeans: ['jeans', 'denim'],
  trousers: ['trousers', 'pants', 'slacks'],
  skirt: ['skirt'],
  shirt: ['shirt', 'blouse', 'button-down', 'button down', 'overshirt'],
  'knit top': ['knit top', 'knitted top', 'sweater', 'jumper', 'pullover', 'cardigan', 'knitwear'],
  't-shirt': ['t-shirt', 't shirt', 'tshirt', 'tee-shirt', 'tee shirt', 'tee'],
};

const TOP_TERMS = ['shirt', 'blouse', 'top', 'tee', 't-shirt', 't shirt', 'sweater', 'jumper', 'pullover', 'cardigan', 'knit'];
const BOTTOM_TERMS = ['jeans', 'denim', 'trousers', 'pants', 'slacks', 'skirt'];
const NON_SINGLE_GARMENT_TERMS = ['jacket', 'coat', 'dress', 'jumpsuit', 'shoes', 'shoe', 'sneaker', 'boot', 'bag', 'belt', 'hat', 'scarf', 'outfit set'];

function string(value, max = MAX_ATTRIBUTE_LENGTH) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ').slice(0, max);
}

function safeHttpsUrl(value) {
  if (typeof value !== 'string' || value.length > 2_048) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !url.hostname || url.username || url.password || isPrivateHost(url.hostname)) return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

function isPrivateHost(hostname) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) return true;
  if (isIP(host) === 4) {
    const [a, b] = host.split('.').map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
  }
  if (isIP(host) === 6) return host === '::1' || host === '::' || host.startsWith('fe80:') || host.startsWith('fc') || host.startsWith('fd');
  return false;
}

function sleeveFor(value) {
  const text = string(value, 500).toLowerCase();
  if (/\b(sleeveless|no sleeves?|tank)\b/.test(text)) return 'sleeveless';
  if (/\b(long|full)[ -]sleeve[ds]?\b/.test(text)) return 'long sleeve';
  if (/\b(short|cap)[ -]sleeve[ds]?\b/.test(text)) return 'short sleeve';
  if (/\b(three[ -]quarter|3\/4)[ -]sleeve[ds]?\b/.test(text)) return 'three-quarter sleeve';
  return '';
}

function necklineFor(value) {
  const text = string(value, 500).toLowerCase();
  if (/\b(collarless|band collar|mandarin collar)\b/.test(text)) return 'collarless';
  if (/\b(crew[ -]neck(?:line)?|round[ -]neck(?:line)?)\b/.test(text)) return 'crew neck';
  if (/\bv[ -]neck\b/.test(text)) return 'v neck';
  if (/\b(turtle[ -]?neck|roll[ -]neck)\b/.test(text)) return 'turtleneck';
  if (/\b(collar|collared|point collar|spread collar|button[ -]down)\b/.test(text)) return 'collared';
  return '';
}

function closureFor(value) {
  const text = string(value, 500).toLowerCase();
  if (/\b(button[ -](front|up|down)|front buttons)\b/.test(text)) return 'button front';
  if (/\b(pullover|pull[ -]over)\b/.test(text)) return 'pullover';
  return '';
}

function normalizeAttributes(attributes) {
  if (!attributes || typeof attributes !== 'object' || Array.isArray(attributes)) return null;
  const category = string(attributes.category).toLowerCase();
  const garment_type = string(attributes.garment_type).toLowerCase();
  if (!['top', 'bottom'].includes(category) || !Object.hasOwn(GARMENT_TERMS, garment_type)) return null;
  if ((category === 'top') !== ['shirt', 'knit top', 't-shirt'].includes(garment_type)) return null;
  return {
    category,
    garment_type,
    colour: string(attributes.colour),
    pattern: string(attributes.pattern),
    material: string(attributes.material),
    silhouette: string(attributes.silhouette),
    length: string(attributes.length),
    details: string(attributes.details),
    sleeves: category === 'top' ? sleeveFor(attributes.sleeves) || sleeveFor(attributes.details) : '',
    neckline: category === 'top' ? necklineFor(attributes.neckline) || necklineFor(attributes.details) : '',
    closure: category === 'top' ? closureFor(attributes.closure) || closureFor(attributes.details) : '',
  };
}

function queryFor(attributes) {
  // Keep visible construction details, while omitting redundant or unknown descriptors.
  const material = attributes.garment_type === 'jeans' && /^denim$/i.test(attributes.material)
    ? '' : attributes.material;
  const length = /^(full length|regular|unspecified)$/i.test(attributes.length) ? '' : attributes.length;
  return [...new Set([attributes.colour, attributes.sleeves, attributes.neckline,
    attributes.closure, attributes.silhouette, material, attributes.garment_type,
    attributes.pattern.toLowerCase() === 'solid' ? '' : attributes.pattern, length]
    .filter(value => value && value.toLowerCase() !== 'unspecified'))].join(' ');
}

const searchFailure = (code, httpStatus) => Object.assign(new Error(code), { code, httpStatus });
const failureMessages = {
  SEARCH_TIMEOUT: 'Product search took too long. Please try again.',
  SEARCH_CONNECTION_FAILED: 'We could not connect to the product-search service. Please try again.',
  SEARCH_AUTH_FAILED: 'The product-search service rejected its API key. Check the search configuration.',
  SEARCH_LIMIT_REACHED: 'The product-search service has reached its request or credit limit. Please try again later.',
  SEARCH_INVALID_REQUEST: 'The product-search service could not accept this search. Please check the search configuration.',
  SEARCH_INVALID_RESPONSE: 'The product-search service returned an unreadable response. Please try again.',
  SEARCH_PROVIDER_ERROR: 'The product-search service is temporarily unavailable. Please try again.',
};

function wordsFor(value) {
  return string(value).toLowerCase().split(/[^a-z0-9]+/).filter(word => word.length > 1);
}

function includesTerm(text, term) {
  return termPattern(term).test(text);
}

function termPattern(term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}${term.endsWith('s') ? '' : '(?:s)?'}\\b`, 'g');
}

function listingText(result) {
  return [result.title, result.snippet, result.extensions].flat()
    .filter(value => typeof value === 'string').join(' ').toLowerCase();
}

function garmentTypes(text) {
  // Match compounds first so “T-shirt” cannot become evidence for a collared shirt.
  const types = new Set();
  let remaining = text;
  for (const type of ['t-shirt', 'knit top']) {
    for (const term of GARMENT_TERMS[type]) {
      if (includesTerm(remaining, term)) {
        types.add(type);
        remaining = remaining.replace(termPattern(term), ' ');
      }
    }
  }
  for (const type of ['shirt', 'jeans', 'trousers', 'skirt']) {
    if (GARMENT_TERMS[type].some(term => includesTerm(remaining, term))) types.add(type);
  }
  return types;
}

function isExpectedGarment(result, attributes) {
  const text = listingText(result);
  const types = garmentTypes(text);
  if (!types.has(attributes.garment_type) || types.size !== 1) return false;
  const categoryText = text.replace(/\bdress\s+(pants|trousers|shirts?)\b/g, '$1');
  if (NON_SINGLE_GARMENT_TERMS.some(term => includesTerm(categoryText, term))) return false;
  const opposite = attributes.category === 'top' ? BOTTOM_TERMS : TOP_TERMS;
  if (opposite.some(term => includesTerm(text, term))) return false;
  // Missing listing details are unknown; only explicit contradictions reject a result.
  for (const [field, detect] of [['sleeves', sleeveFor], ['neckline', necklineFor], ['closure', closureFor]]) {
    const actual = detect(text);
    if (attributes[field] && actual && actual !== attributes[field]) return false;
  }
  return true;
}

function matchNotes(result, attributes) {
  const text = listingText(result);
  const notes = ['garment type'];
  for (const [label, value] of [['colour', attributes.colour], ['silhouette', attributes.silhouette], ['material', attributes.material], ['length', attributes.length]]) {
    const terms = wordsFor(value);
    if (terms.length && terms.every(term => includesTerm(text, term))) notes.push(label);
  }
  for (const [label, field, detect] of [['sleeve length', 'sleeves', sleeveFor], ['neckline', 'neckline', necklineFor], ['closure', 'closure', closureFor]]) {
    if (attributes[field] && detect(text) === attributes[field]) notes.push(label);
  }
  return notes;
}

function priceFields(raw) {
  if (typeof raw.price === 'string' && raw.price.trim()) {
    const fields = { price: raw.price.trim() };
    if (typeof raw.currency === 'string' && raw.currency.trim()) fields.currency = raw.currency.trim();
    return fields;
  }
  if (raw.price && typeof raw.price === 'object' && typeof raw.price.value === 'string' && raw.price.value.trim()) {
    const fields = { price: raw.price.value.trim() };
    if (typeof raw.price.currency === 'string' && raw.price.currency.trim()) fields.currency = raw.price.currency.trim();
    return fields;
  }
  return {};
}

function candidateLists(payload) {
  const lists = [payload.visual_matches, payload.product_results, payload.shopping_results, payload.inline_shopping_results];
  if (Array.isArray(payload.categorized_shopping_results)) lists.push(...payload.categorized_shopping_results.map(group => group?.shopping_results));
  return lists.filter(Array.isArray);
}

export function parseProductResults(payload, attributes) {
  attributes = normalizeAttributes(attributes);
  if (!attributes || !payload || typeof payload !== 'object') return [];
  const candidates = candidateLists(payload).flatMap(list => list.slice(0, 60));
  const seen = new Set();
  return candidates
    .filter(raw => raw && typeof raw === 'object')
    .map(raw => {
      const title = string(raw.title, 240);
      const url = safeHttpsUrl(raw.product_link || raw.link);
      const retailer = string(raw.source || raw.merchant || raw.store, 120);
      if (!title || !url || !retailer || !isExpectedGarment(raw, attributes)) return null;
      const canonical = new URL(url);
      canonical.hash = '';
      for (const key of [...canonical.searchParams.keys()]) if (/^(utm_|gclid$|fbclid$)/i.test(key)) canonical.searchParams.delete(key);
      const canonicalKey = canonical.toString().replace(/\/$/, '');
      if (seen.has(canonicalKey)) return null;
      seen.add(canonicalKey);
      const product = { title, retailer, url, ...priceFields(raw) };
      const thumbnail = safeHttpsUrl(raw.thumbnail || raw.image);
      if (thumbnail) product.thumbnail = thumbnail;
      const notes = matchNotes(raw, attributes);
      if (notes.length) product.match_notes = notes;
      return { product, evidence: notes.reduce((score, note) => score + (['sleeve length', 'neckline', 'closure'].includes(note) ? 3 : 1), 0) };
    })
    .filter(Boolean)
    .sort((a, b) => b.evidence - a.evidence)
    .slice(0, 6)
    .map(item => item.product);
}

function cloneResult(result, source_state) {
  return { ...result, source_state, products: result.products.map(product => ({ ...product, ...(product.match_notes ? { match_notes: [...product.match_notes] } : {}) })) };
}

async function readResponseJson(response) {
  const declaredLength = Number(response.headers?.get?.('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_RESPONSE_BYTES) throw new Error('search response too large');
  if (response.body?.getReader) {
    const reader = response.body.getReader();
    const chunks = [];
    let bytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new Error('search response too large');
      }
      chunks.push(value);
    }
    return JSON.parse(new TextDecoder().decode(Buffer.concat(chunks.map(chunk => Buffer.from(chunk)))));
  }
  const data = await response.json();
  if (Buffer.byteLength(JSON.stringify(data)) > MAX_RESPONSE_BYTES) throw new Error('search response too large');
  return data;
}

export function createProductSearch({ env = process.env, fetchImpl = fetch, now = Date.now, diagnose = event => console.warn('[heyTwin search]', JSON.stringify(event)) } = {}) {
  const cache = new Map();
  const pending = new Map();
  const configuredTimeout = Number(env?.SERPAPI_TIMEOUT_MS);
  const requestTimeout = Number.isFinite(configuredTimeout)
    ? Math.min(MAX_REQUEST_TIMEOUT_MS, Math.max(MIN_REQUEST_TIMEOUT_MS, configuredTimeout))
    : DEFAULT_REQUEST_TIMEOUT_MS;

  async function request(params) {
    const url = new URL(SERPAPI_ENDPOINT);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    const controller = new AbortController();
    let timer;
    const deadline = new Promise((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(searchFailure('SEARCH_TIMEOUT'));
      }, requestTimeout);
    });
    try {
      const response = await Promise.race([fetchImpl(url, { signal: controller.signal, redirect: 'error', headers: { accept: 'application/json' } }), deadline]);
      if (!response?.ok) {
        const code = [401, 403].includes(response?.status) ? 'SEARCH_AUTH_FAILED' : response?.status === 429 ? 'SEARCH_LIMIT_REACHED' : response?.status === 400 ? 'SEARCH_INVALID_REQUEST' : 'SEARCH_PROVIDER_ERROR';
        throw searchFailure(code, response?.status);
      }
      let data;
      try { data = await Promise.race([readResponseJson(response), deadline]); }
      catch (error) { if (error.code === 'SEARCH_TIMEOUT' || controller.signal.aborted) throw searchFailure('SEARCH_TIMEOUT'); throw searchFailure('SEARCH_INVALID_RESPONSE'); }
      if (typeof data?.error === 'string' && /^Google hasn't returned any results for this query\.?$/i.test(data.error.trim())) return { shopping_results: [] };
      if (!data || typeof data !== 'object' || Array.isArray(data) || data.error) throw searchFailure('SEARCH_PROVIDER_ERROR');
      return data;
    } catch (error) {
      const code = controller.signal.aborted || ['AbortError', 'TimeoutError'].includes(error.name) ? 'SEARCH_TIMEOUT' : failureMessages[error.code] ? error.code : 'SEARCH_CONNECTION_FAILED';
      // Never log provider error text or URLs: either may contain credentials.
      try { diagnose({ engine: params.engine, code, ...(error.httpStatus ? { http_status: error.httpStatus } : {}) }); } catch {}
      throw searchFailure(code, error.httpStatus);
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    async search({ attributes, imageUrl } = {}) {
      const normalized = normalizeAttributes(attributes);
      if (!normalized) return { status: 'succeeded', products: [], method: 'text', message: 'The garment details are incomplete.', source_state: 'live' };
      const image = safeHttpsUrl(imageUrl);
      const query = queryFor(normalized);
      const cacheKey = JSON.stringify({ attributes: normalized, imageUrl: image || '' });
      const cached = cache.get(cacheKey);
      if (cached && now() - cached.at < CACHE_TTL_MS) return cloneResult(cached.result, 'cache');
      if (cached) cache.delete(cacheKey);
      if (pending.has(cacheKey)) return pending.get(cacheKey);

      const task = (async () => {
        const apiKey = string(env?.SERPAPI_API_KEY, 512);
        if (!apiKey) return { status: 'setup_required', products: [], method: image ? 'visual' : 'text', message: 'Similar-piece search is not configured yet.', source_state: 'live' };
        let products = [];
        let method = 'text';
        if (image) {
          try {
            const visual = await request({ engine: 'google_lens', type: 'products', url: image, api_key: apiKey });
            products = parseProductResults(visual, normalized);
            if (products.length) method = 'visual';
          } catch {
            // Text search below is the documented fallback when visual search cannot return products.
          }
        }
        if (!products.length) {
          try {
            const text = await request({ engine: 'google_shopping', q: query, api_key: apiKey });
            products = parseProductResults(text, normalized);
          } catch (error) {
            return { status: 'failed', products: [], method: 'text', query, code: error.code, message: failureMessages[error.code] || failureMessages.SEARCH_PROVIDER_ERROR, source_state: 'live' };
          }
        }
        const result = { status: 'succeeded', products, method, ...(method === 'text' ? { query } : {}), ...(products.length ? {} : { message: 'No similar pieces were found.' }), source_state: 'live' };
        cache.set(cacheKey, { at: now(), result });
        while (cache.size > MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value);
        return cloneResult(result, 'live');
      })();
      pending.set(cacheKey, task);
      try { return await task; } finally { pending.delete(cacheKey); }
    },
  };
}
