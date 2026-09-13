#!/usr/bin/env node
// Generic blogshop/merchant importer for data/sources.json's merchant_products and
// merchant_collections. Every entry MUST carry a non-empty permission_basis recorded by
// a human before this script will touch it — "public and scrapable" is not treated as
// "reuse permitted". Entries also need reviewed:true to be promoted into the live
// catalogue, mirroring the Commons file-review gate in fetch-commons.mjs.
import path from 'node:path';
import {
  dataDir, loadJson, saveJson, loadItems, saveItems, upsertItem, findByImageHash, findBySourcePage,
  slugify, shortHash, sha256File, validateAndProcessImage, writeCatalogueImage, today, newRunLog, record, isAllowedByRobots,
} from './lib.mjs';
import { cachedGetText, cachedGetBinary } from './lib.mjs';
import { extractProduct, extractProductLinks } from './merchant.mjs';

const sourcesPath = path.join(dataDir, 'sources.json');

export async function importProduct(url, entry, { items, fetchImpl = fetch, sourceName = new URL(url).hostname } = {}) {
  if (!entry.permission_basis || !entry.permission_basis.trim()) {
    return { status: 'skipped', reason: 'missing-permission-basis', url };
  }
  if (!(await isAllowedByRobots(url, fetchImpl))) return { status: 'skipped', reason: 'robots-disallowed', url };
  const existing = findBySourcePage(items, url);
  if (existing) return { status: 'duplicate', reason: 'already-imported', url, existing: existing.id };

  const page = await cachedGetText(url, { cacheSubdir: 'merchant/pages', fetchImpl });
  if (page.blocked) return { status: 'skipped', reason: 'robots-disallowed', url };
  if (page.status !== 200) return { status: 'failed', reason: `http-${page.status}`, url };

  const product = extractProduct(page.body);
  if (!product) return { status: 'failed', reason: 'no-product-image-found', url };
  let imageUrl;
  try { imageUrl = new URL(product.imageUrl, url).toString(); } catch { return { status: 'failed', reason: 'invalid-image-url', url }; }

  const image = await cachedGetBinary(imageUrl, { cacheSubdir: 'originals', fetchImpl });
  if (image.blocked) return { status: 'skipped', reason: 'robots-disallowed', url: imageUrl };
  if (image.status !== 200 || !image.buffer) return { status: 'failed', reason: `image-http-${image.status}`, url };

  const hash = sha256File(image.buffer);
  const dupe = findByImageHash(items, hash);
  if (dupe) return { status: 'duplicate', reason: 'identical-image-hash', url, existing: dupe.id };

  const processed = await validateAndProcessImage(image.buffer);
  if (!processed.ok) return { status: 'failed', reason: processed.reason, url };

  if (!entry.reviewed) return { status: 'skipped', reason: 'not-yet-reviewed', url };

  const id = `${entry.target_category}-${slugify(entry.subcategory || product.name || 'item')}-${shortHash(url, 6)}`;
  const { image_ref, thumbnail_ref } = writeCatalogueImage(id, processed.preview, processed.thumbnail);
  const item = {
    id, name: entry.name || product.name || 'Untitled item', category: entry.target_category, subcategory: entry.subcategory || '',
    colour_primary: entry.colour_primary || '', colour_secondary: entry.colour_secondary || '', pattern: entry.pattern || '',
    description: entry.description || product.name || '', style_tags: entry.style_tags || [], occasion_tags: entry.occasion_tags || [],
    fit: entry.fit || '', image_type: entry.image_type || '', image_local: `public${image_ref}`, thumbnail_local: `public${thumbnail_ref}`,
    image_ref, thumbnail_ref, source_page: url, source_image_url: imageUrl, source_name: entry.source_name || sourceName,
    brand: '', retrieved_at: today(), permission_basis: entry.permission_basis, license_url: entry.license_url || '',
    attribution: entry.attribution || '', provenance: 'manual_review', review_status: 'approved', active: true,
    image_hash: hash, dimensions: { width: processed.width, height: processed.height },
  };
  upsertItem(items, item);
  return { status: 'accepted', url, id };
}

export async function importCollection(entry, { items, fetchImpl = fetch } = {}) {
  if (!entry.permission_basis || !entry.permission_basis.trim()) return [{ status: 'skipped', reason: 'missing-permission-basis', url: entry.url }];
  const page = await cachedGetText(entry.url, { cacheSubdir: 'merchant/pages', fetchImpl });
  if (page.blocked) return [{ status: 'skipped', reason: 'robots-disallowed', url: entry.url }];
  if (page.status !== 200) return [{ status: 'failed', reason: `http-${page.status}`, url: entry.url }];
  const links = extractProductLinks(page.body, entry.url).slice(0, entry.max_items || 20);
  const results = [];
  for (const link of links) results.push(await importProduct(link, entry, { items, fetchImpl }));
  return results;
}

async function main() {
  const sources = loadJson(sourcesPath, {});
  const items = loadItems();
  const runLog = newRunLog();
  const products = sources.merchant_products || [];
  const collections = sources.merchant_collections || [];
  if (!products.length && !collections.length) { console.log('No merchant_products or merchant_collections configured in data/sources.json — nothing to import.'); return; }

  for (const entry of products) {
    const result = await importProduct(entry.url, entry, { items });
    console.log(`[${result.status}] ${entry.url}${result.reason ? ` (${result.reason})` : ''}`);
    record(runLog, result.status, { source: entry.url, reason: result.reason });
    if (result.status === 'accepted') saveItems(items);
  }
  for (const entry of collections) {
    const results = await importCollection(entry, { items });
    for (const result of results) {
      console.log(`[${result.status}] ${result.url}${result.reason ? ` (${result.reason})` : ''}`);
      record(runLog, result.status, { source: result.url, reason: result.reason });
    }
    saveItems(items);
  }
  saveItems(items);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) await main();
