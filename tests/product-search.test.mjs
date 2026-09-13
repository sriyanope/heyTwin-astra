import test from 'node:test';
import assert from 'node:assert/strict';
import { createProductSearch, parseProductResults } from '../lib/product-search.mjs';

const attrs = { category: 'bottom', garment_type: 'jeans', colour: 'indigo', pattern: 'solid', material: 'denim', silhouette: 'straight leg', length: 'full length', details: '' };
const item = (overrides = {}) => ({ title: 'Indigo straight leg full length denim jeans', link: 'https://shop.example/products/jeans?utm_source=test', source: 'Example Shop', thumbnail: 'https://cdn.example/jeans.jpg', price: { value: '$89', currency: '$' }, ...overrides });

test('dress pants and dress shirts are garments, while standalone dresses are rejected', () => {
  assert.equal(parseProductResults({ shopping_results: [item({ title: 'Olive tapered dress pants' })] }, { ...attrs, garment_type: 'trousers' }).length, 1);
  assert.equal(parseProductResults({ shopping_results: [item({ title: 'White cotton dress shirt' })] }, { ...attrs, category: 'top', garment_type: 'shirt' }).length, 1);
  assert.equal(parseProductResults({ shopping_results: [item({ title: 'White shirt dress' })] }, { ...attrs, category: 'top', garment_type: 'shirt' }).length, 0);
});

test('Google no-results response is an honest empty search, not a provider failure', async () => {
  const search = createProductSearch({ env: { SERPAPI_API_KEY: 'private-test-key' }, fetchImpl: async () => new Response(JSON.stringify({ error: "Google hasn't returned any results for this query." })) });
  const result = await search.search({ attributes: attrs });
  assert.equal(result.status, 'succeeded');
  assert.deepEqual(result.products, []);
});

test('text query removes a redundant material synonym without weakening garment type', async () => {
  let query = '';
  const search = createProductSearch({ env: { SERPAPI_API_KEY: 'private-test-key' }, fetchImpl: async url => {
    query = new URL(url).searchParams.get('q');
    return new Response(JSON.stringify({ error: "Google hasn't returned any results for this query." }));
  } });
  const result = await search.search({ attributes: attrs });
  assert.equal(result.status, 'succeeded');
  assert.equal(query, 'indigo straight leg jeans');
});

test('parser filters wrong categories and malformed entries, preserves absent prices, and canonicalizes duplicates', () => {
  const products = parseProductResults({ visual_matches: [
    item(),
    item({ link: 'https://shop.example/products/jeans?gclid=tracking' }),
    item({ title: 'Indigo denim jacket', link: 'https://shop.example/jacket' }),
    item({ title: 'Indigo straight-leg trousers', link: 'https://shop.example/trousers' }),
    item({ link: 'javascript:alert(1)' }),
    item({ title: '', link: 'https://shop.example/empty' }),
    item({ title: 'Indigo denim jeans', link: 'https://shop.example/no-price', price: undefined }),
  ] }, attrs);
  assert.equal(products.length, 2);
  assert.equal(products[0].url, 'https://shop.example/products/jeans?utm_source=test');
  assert.deepEqual(products[0].match_notes, ['colour', 'silhouette', 'material', 'length']);
  assert.equal(products[1].price, undefined);
  assert.equal(products[1].currency, undefined);
});

test('parser returns empty output for missing or unusable provider payloads', () => {
  assert.deepEqual(parseProductResults(null, attrs), []);
  assert.deepEqual(parseProductResults({ shopping_results: [{ title: 'Indigo jeans', product_link: 'http://shop.example/jeans', source: 'Shop' }] }, attrs), []);
  assert.deepEqual(parseProductResults({ shopping_results: [{ title: 'Indigo jeans', product_link: 'https://user:pass@shop.example/jeans', source: 'Shop' }] }, attrs), []);
  assert.deepEqual(parseProductResults({ shopping_results: [{ title: 'Indigo jeans', product_link: 'https://127.0.0.1/jeans', source: 'Shop' }] }, attrs), []);
  assert.deepEqual(parseProductResults({ shopping_results: [{ title: 'Indigo jeans', product_link: 'https://catalogue.local/jeans', source: 'Shop' }] }, attrs), []);
});

test('parser rejects a wrong garment type even when it is in the requested top-level category', () => {
  const trousers = { ...attrs, garment_type: 'trousers' };
  const tee = { ...attrs, category: 'top', garment_type: 't-shirt' };
  assert.deepEqual(parseProductResults({ shopping_results: [item({ title: 'Indigo denim skirt', product_link: 'https://shop.example/denim-skirt', link: undefined })] }, attrs), []);
  assert.deepEqual(parseProductResults({ shopping_results: [item({ title: 'Black trousers and skirt set', product_link: 'https://shop.example/trouser-skirt', link: undefined })] }, trousers), []);
  assert.deepEqual(parseProductResults({ shopping_results: [item({ title: 'White t-shirt with collared shirt', product_link: 'https://shop.example/tee-shirt', link: undefined })] }, tee), []);
  assert.equal(parseProductResults({ shopping_results: [item({ title: 'White cotton t-shirt', product_link: 'https://shop.example/cotton-tee', link: undefined })] }, tee).length, 1);
});

test('visual search falls back to documented Google Shopping text search after a failure', async () => {
  const urls = [];
  const options = [];
  const search = createProductSearch({ env: { SERPAPI_API_KEY: 'test-key' }, fetchImpl: async (url, requestOptions) => {
    urls.push(new URL(url));
    options.push(requestOptions);
    if (urls.length === 1) throw new TypeError('network failure');
    return { ok: true, json: async () => ({ shopping_results: [item({ product_link: 'https://shop.example/text-jeans', link: undefined })] }) };
  } });
  const result = await search.search({ attributes: attrs, imageUrl: 'https://images.example/generated-jeans.png' });
  assert.equal(result.method, 'text');
  assert.equal(result.products.length, 1);
  assert.equal(urls[0].searchParams.get('engine'), 'google_lens');
  assert.equal(urls[0].searchParams.get('type'), 'products');
  assert.equal(urls[0].searchParams.get('url'), 'https://images.example/generated-jeans.png');
  assert.equal(options[0].redirect, 'error');
  assert.equal(urls[1].searchParams.get('engine'), 'google_shopping');
  assert.match(urls[1].searchParams.get('q'), /indigo.*jeans/);
});

test('keeps explicit source currency for string prices and prefers a direct product link', () => {
  const [product] = parseProductResults({ shopping_results: [item({
    price: '$99', currency: 'USD', link: 'https://www.google.com/shopping/product/redirect', product_link: 'https://shop.example/direct-jeans',
  })] }, attrs);
  assert.equal(product.url, 'https://shop.example/direct-jeans');
  assert.equal(product.price, '$99');
  assert.equal(product.currency, 'USD');
});

test('omits unspecified query terms and reports provider-wide failures separately from zero results', async () => {
  let query = '';
  const noImageAttributes = { ...attrs, pattern: 'unspecified', material: 'Unspecified' };
  const search = createProductSearch({ env: { SERPAPI_API_KEY: 'test-key' }, fetchImpl: async url => {
    query = new URL(url).searchParams.get('q');
    throw new TypeError('offline');
  } });
  const result = await search.search({ attributes: noImageAttributes });
  assert.equal(result.status, 'failed');
  assert.doesNotMatch(query, /unspecified/i);
});

test('caps streamed provider responses before parsing', async () => {
  const body = JSON.stringify({ shopping_results: [], padding: 'x'.repeat(1_000_000) });
  const search = createProductSearch({ env: { SERPAPI_API_KEY: 'test-key' }, fetchImpl: async () => new Response(body, { headers: { 'content-type': 'application/json' } }) });
  const result = await search.search({ attributes: attrs });
  assert.equal(result.status, 'failed');
});

test('zero usable visual results also falls back, deduplicates in-flight work, and caches the completed response', async () => {
  let calls = 0;
  let now = 0;
  const search = createProductSearch({ env: { SERPAPI_API_KEY: 'test-key' }, now: () => now, fetchImpl: async url => {
    calls++;
    const engine = new URL(url).searchParams.get('engine');
    await new Promise(resolve => setTimeout(resolve, 5));
    return { ok: true, json: async () => engine === 'google_lens' ? { visual_matches: [item({ title: 'Blue wool shirt', link: 'https://shop.example/shirt' })] } : { shopping_results: [item({ product_link: 'https://shop.example/cached-jeans', link: undefined })] } };
  } });
  const request = { attributes: attrs, imageUrl: 'https://images.example/generated-jeans.png' };
  const [first, second] = await Promise.all([search.search(request), search.search(request)]);
  assert.equal(calls, 2);
  assert.equal(first.source_state, 'live');
  assert.equal(second.products[0].url, first.products[0].url);
  now = 1;
  const cached = await search.search(request);
  assert.equal(calls, 2);
  assert.equal(cached.source_state, 'cache');
});

test('returns an explicit setup state without making a provider request', async () => {
  let calls = 0;
  const result = await createProductSearch({ env: {}, fetchImpl: async () => { calls++; } }).search({ attributes: attrs });
  assert.equal(result.status, 'setup_required');
  assert.equal(calls, 0);
});
