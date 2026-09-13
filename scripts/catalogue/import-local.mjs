#!/usr/bin/env node
// Local image import path: for garment photos you already have the rights to use
// (your own photos, a merchant's direct grant, etc). No network access at all.
// Configure entries under data/sources.json -> local[]; each needs a non-empty
// permission_basis (e.g. "own photo" or "merchant granted reuse by email 2026-09-10").
import fs from 'node:fs';
import path from 'node:path';
import {
  root, dataDir, loadJson, saveItems, loadItems, upsertItem, findByImageHash,
  slugify, shortHash, sha256File, validateAndProcessImage, writeCatalogueImage, today, newRunLog, record, appendRunLog,
} from './lib.mjs';

const sourcesPath = path.join(dataDir, 'sources.json');

async function main() {
  const sources = loadJson(sourcesPath, {});
  const entries = sources.local || [];
  const items = loadItems();
  const runLog = newRunLog();
  if (!entries.length) { console.log('No local[] entries configured in data/sources.json — nothing to import.'); return; }

  for (const entry of entries) {
    const absolutePath = path.resolve(root, entry.path || '');
    if (!entry.path || !fs.existsSync(absolutePath)) { console.log(`[failed] ${entry.path || '(no path)'}: file not found`); record(runLog, 'failed', { reason: 'file-not-found', source: entry.path }); continue; }
    if (!entry.permission_basis || !entry.permission_basis.trim()) { console.log(`[skipped] ${entry.path}: missing permission_basis`); record(runLog, 'skipped', { reason: 'missing-permission-basis', source: entry.path }); continue; }
    if (!entry.target_category || !['top', 'bottom'].includes(entry.target_category)) { console.log(`[failed] ${entry.path}: target_category must be "top" or "bottom"`); record(runLog, 'failed', { reason: 'invalid-target-category', source: entry.path }); continue; }

    const buffer = fs.readFileSync(absolutePath);
    const hash = sha256File(buffer);
    const dupe = findByImageHash(items, hash);
    if (dupe) { console.log(`[skip-duplicate] ${entry.path}: identical image already catalogued as ${dupe.id}`); record(runLog, 'duplicate', { reason: 'identical-image-hash', source: entry.path, existing: dupe.id }); continue; }

    const processed = await validateAndProcessImage(buffer);
    if (!processed.ok) { console.log(`[failed] ${entry.path}: ${processed.reason}`); record(runLog, 'failed', { reason: processed.reason, source: entry.path }); continue; }

    const id = `${entry.target_category}-${slugify(entry.subcategory || path.basename(absolutePath, path.extname(absolutePath)))}-${shortHash(absolutePath, 6)}`;
    const { image_ref, thumbnail_ref } = writeCatalogueImage(id, processed.preview, processed.thumbnail);
    const description = [entry.colour_primary, entry.pattern && entry.pattern !== 'solid' ? entry.pattern : '', entry.subcategory].filter(Boolean).join(' ') || entry.name || path.basename(absolutePath);

    const item = {
      id, name: entry.name || description, category: entry.target_category, subcategory: entry.subcategory || '',
      colour_primary: entry.colour_primary || '', colour_secondary: entry.colour_secondary || '', pattern: entry.pattern || '',
      description, style_tags: entry.style_tags || [], occasion_tags: entry.occasion_tags || [], fit: entry.fit || '',
      image_type: entry.image_type || '', image_local: `public${image_ref}`, thumbnail_local: `public${thumbnail_ref}`,
      image_ref, thumbnail_ref, source_page: '', source_image_url: '', source_name: entry.source_name || 'Local upload',
      brand: '', retrieved_at: today(), permission_basis: entry.permission_basis, license_url: '',
      attribution: entry.attribution || '', provenance: 'manual_review', review_status: 'approved', active: true,
      image_hash: hash, dimensions: { width: processed.width, height: processed.height },
    };
    upsertItem(items, item);
    console.log(`[accepted] ${entry.path} -> ${id}`);
    record(runLog, 'accepted', { source: entry.path, id });
  }
  saveItems(items);
  appendRunLog('local-import', runLog);
}

main();
