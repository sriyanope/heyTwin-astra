// One description-only SerpApi request. Keys and credential-bearing URLs are never logged.
import fs from 'node:fs/promises';
import { loadEnv } from '../server.mjs';
import { createProductSearch } from '../lib/product-search.mjs';
const env = loadEnv();
if (!env.SERPAPI_API_KEY) throw new Error('SERPAPI_API_KEY is missing.');
const diagnostics = [];
const started = Date.now();
const search = createProductSearch({ env, fetchImpl: async (url, options) => {
  const target = new URL(url);
  if (target.origin !== 'https://serpapi.com' || target.searchParams.get('engine') !== 'google_shopping') throw new Error('Only text Shopping search is allowed.');
  const event = { engine: target.searchParams.get('engine'), query: target.searchParams.get('q') };
  diagnostics.push(event);
  try {
    const response = await fetch(url, options);
    event.http_status = response.status;
    const body = await response.clone().json().catch(() => null);
    event.provider_error = typeof body?.error === 'string' ? body.error.replaceAll(env.SERPAPI_API_KEY, '[redacted]').slice(0, 300) : null;
    event.shopping_results = Array.isArray(body?.shopping_results) ? body.shopping_results.length : 0;
    event.response_fields = body ? Object.keys(body) : [];
    return response;
  } catch (error) {
    event.error_name = error.name;
    event.connection_code = error.cause?.code;
    throw error;
  } finally { event.elapsed_ms = Date.now() - started; }
} });
const result = await search.search({ attributes: { category: 'bottom', garment_type: 'trousers', colour: 'olive', silhouette: 'tapered', material: 'cotton twill', pattern: 'solid', length: 'ankle length', description: 'Olive tapered trousers' } });
const report = { checked_at: new Date().toISOString(), diagnostics, result };
await fs.mkdir('verification/product-search', { recursive: true });
await fs.writeFile(`verification/product-search/check-${Date.now()}.json`, JSON.stringify(report, null, 2));
await fs.writeFile('verification/product-search/live-result.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
