import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { catalogue } from '../data/catalogue.mjs';
import { createApp } from '../server.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a2ioAAAAASUVORK5CYII=';

test('every catalogue item has a unique id', () => {
  const ids = catalogue.map(item => item.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('every catalogue item resolves to a real, non-empty local image file', () => {
  assert.ok(catalogue.length > 0);
  for (const item of catalogue) {
    assert.match(item.image_ref, /^\/catalogue\//, `${item.id} has a suspicious image_ref`);
    const filePath = path.join(root, 'public', item.image_ref);
    assert.ok(fs.existsSync(filePath), `${item.id} -> ${item.image_ref} does not exist on disk`);
    assert.ok(fs.statSync(filePath).size > 0, `${item.id} -> ${item.image_ref} is empty`);
  }
});

test('every catalogue item has both a top and bottom counterpart available', () => {
  const tops = catalogue.filter(item => item.category === 'top');
  const bottoms = catalogue.filter(item => item.category === 'bottom');
  assert.ok(tops.length > 0, 'no tops in the catalogue');
  assert.ok(bottoms.length > 0, 'no bottoms in the catalogue');
});

test('imported (non-illustration) items carry the metadata the recommendation prompt and UI need', () => {
  const imported = catalogue.filter(item => item.image_type !== 'illustration');
  for (const item of imported) {
    assert.ok(['top', 'bottom'].includes(item.category), `${item.id} has an invalid category`);
    assert.ok(item.colour, `${item.id} is missing a colour`);
    assert.ok(item.description, `${item.id} is missing a description`);
    assert.ok(item.source_name, `${item.id} is missing a source_name`);
  }
});

async function start(t, options) {
  const app = createApp(options).listen(0, '127.0.0.1');
  await once(app, 'listening');
  t.after(() => new Promise(resolve => app.close(resolve)));
  const url = `http://127.0.0.1:${app.address().port}`;
  return async (route, payload) => {
    const response = await fetch(url + route, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    return { status: response.status, body: await response.json() };
  };
}
const analysis = category => ({ usable: true, attributes: Object.fromEntries(Object.entries({ category, colour: 'blue', pattern: 'solid' }).map(([key, value]) => [key, { value, confidence: .9 }])), description: `Blue solid ${category}`, confidence: .9, uncertainty: { level: 'high', note: '' } });

test('a real imported bottom can be recommended for an uploaded top, resolving to an on-disk photo', async t => {
  const bottom = catalogue.find(item => item.category === 'bottom' && item.image_type !== 'illustration');
  assert.ok(bottom, 'no imported bottom photo available to test with');
  const post = await start(t, { provider: async (prompt, image) => image ? analysis('top') : { outfits: [{ catalogue_item_id: bottom.id, name: 'Everyday contrast', explanation: 'A grounded, neutral pairing for the blue top.', confidence: .88 }] } });
  const { body: { garment_id } } = await post('/api/analyze-garment', { image: png });
  await post('/api/confirm-garment', { garment_id, corrected_attributes: { category: 'top', colour: 'blue', pattern: 'solid', description: 'Blue solid top' } });
  const result = await post('/api/recommend-outfits', { garment_id });
  assert.equal(result.status, 200);
  const suggestion = result.body.outfits[0].items[1];
  assert.equal(suggestion.ownership, 'suggested_item');
  assert.equal(suggestion.image_ref, bottom.image_ref);
  assert.ok(fs.existsSync(path.join(root, 'public', suggestion.image_ref)));
});

test('a real imported top can be recommended for an uploaded bottom, resolving to an on-disk photo', async t => {
  const top = catalogue.find(item => item.category === 'top' && item.image_type !== 'illustration');
  assert.ok(top, 'no imported top photo available to test with');
  const post = await start(t, { provider: async (prompt, image) => image ? analysis('bottom') : { outfits: [{ catalogue_item_id: top.id, name: 'Everyday contrast', explanation: 'A grounded, neutral pairing for the blue bottom.', confidence: .88 }] } });
  const { body: { garment_id } } = await post('/api/analyze-garment', { image: png });
  await post('/api/confirm-garment', { garment_id, corrected_attributes: { category: 'bottom', colour: 'blue', pattern: 'solid', description: 'Blue solid bottom' } });
  const result = await post('/api/recommend-outfits', { garment_id });
  assert.equal(result.status, 200);
  const suggestion = result.body.outfits[0].items[1];
  assert.equal(suggestion.ownership, 'suggested_item');
  assert.equal(suggestion.image_ref, top.image_ref);
  assert.ok(fs.existsSync(path.join(root, 'public', suggestion.image_ref)));
});
