import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from '../server.mjs';
import { catalogue } from '../data/catalogue.mjs';
import { garmentAttributes, publicImageURL } from '../lib/pairings.mjs';
import { createSearchProfile } from '../lib/search-profile.mjs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a2ioAAAAASUVORK5CYII=';
const confirmed = { category: 'top', colour: 'ivory', pattern: 'floral', description: 'Ivory floral peplum blouse' };
const analysis = { usable: true, attributes: Object.fromEntries(['category', 'colour', 'pattern'].map(key => [key, { value: confirmed[key], confidence: .9 }])), description: confirmed.description, confidence: .9, uncertainty: { level: 'low', note: '' } };
const provider = async (prompt, image) => image ? analysis : { outfits: ['indigo-jeans', 'olive-trousers', 'black-skirt'].map(id => ({ catalogue_item_id: id, name: id, explanation: 'A simple silhouette balances the floral blouse.', confidence: .9 })) };
const empty = () => Object.fromEntries(['image', 'preview', 'model'].map(kind => [kind, { status: 'idle', source_state: 'live' }]));

async function appFor(t, options = {}) {
  const calls = [], searches = [];
  const states = new Map();
  const generation = {
    state: async context => states.get(context.pairing_id) || empty(),
    start: async (kind, context, options) => {
      calls.push({ kind, context, options });
      const state = empty();
      state[kind] = { status: 'succeeded', asset_url: '/generated/test-image.png', source_state: 'cache' };
      states.set(context.pairing_id, state);
      return state;
    },
    asset: async name => name === 'test-image.png' ? { data: options.generatedBytes || Buffer.from(png.split(',')[1], 'base64'), contentType: 'image/png' } : null,
  };
  const app = createApp({ env: options.env || { PUBLIC_ASSET_ORIGIN: 'https://heytwin.example.com' }, provider, generation, ...(options.searchProfile ? { searchProfile: options.searchProfile } : {}), productSearch: { search: async options => { searches.push(options); return { products: [], status: 'succeeded', method: 'text' }; } } }).listen(0, '127.0.0.1');
  await once(app, 'listening');
  t.after(() => new Promise(resolve => app.close(resolve)));
  const url = `http://127.0.0.1:${app.address().port}`;
  const post = async (route, payload, headers = {}) => {
    const response = await fetch(url + '/api/' + route, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(payload) });
    return { status: response.status, data: await response.json() };
  };
  const prepare = async () => {
    const { data: { garment_id } } = await post('analyze-garment', { image: png });
    await post('confirm-garment', { garment_id, corrected_attributes: confirmed });
    const { data: { outfits } } = await post('recommend-outfits', { garment_id });
    return { garment_id, outfits };
  };
  return { post, prepare, url, calls, searches };
}

test('the three examples map to concrete intended garment attributes', () => {
  for (const [id, type, material, silhouette, length] of [
    ['indigo-jeans', 'jeans', 'denim', 'straight-leg', 'full length'],
    ['olive-trousers', 'trousers', 'cotton twill', 'tapered', 'ankle length'],
    ['black-skirt', 'skirt', 'woven cotton', 'A-line', 'midi'],
  ]) {
    const attrs = garmentAttributes(catalogue.find(item => item.id === id));
    assert.deepEqual([attrs.garment_type, attrs.material, attrs.silhouette, attrs.length], [type, material, silhouette, length]);
  }
});

test('session validates pairing ownership, original reference, and cached identity after reupload', async t => {
  const { post, prepare, calls } = await appFor(t);
  const first = await prepare();
  const payload = { garment_id: first.garment_id, pairing_id: first.outfits[0].pairing_id };
  assert.equal((await post('generate-pairing-image', { ...payload, pairing_id: 'invented' })).status, 404);
  assert.equal((await post('generate-pairing-image', { ...payload, retry: 'yes' })).status, 400);
  assert.equal((await post('generate-pairing-image', payload, { origin: 'https://foreign.example' })).status, 403);
  assert.equal((await post('preview-outfit', { ...payload, image: 'invalid' })).status, 400);
  assert.equal(calls.length, 0);
  assert.equal((await post('generate-pairing-image', payload)).status, 202);
  assert.equal((await post('preview-outfit', { ...payload, image: png })).status, 202);
  assert.equal(calls[1].options.image, png);
  assert.equal(calls[1].context.original_attributes.description, confirmed.description);
  const second = await prepare();
  assert.equal(second.outfits[0].pairing_id, first.outfits[0].pairing_id);
  assert.notEqual(second.outfits[1].pairing_id, first.outfits[0].pairing_id);
  await post('discard-garment', { garment_id: first.garment_id });
  assert.equal((await post('pairing-state', payload)).status, 410);
});

test('search only receives a cached suggested garment URL and server-owned attributes', async t => {
  const { post, prepare, searches, url } = await appFor(t);
  const { garment_id, outfits } = await prepare();
  const payload = { garment_id, pairing_id: outfits[0].pairing_id, imageUrl: 'http://127.0.0.1/secrets', attributes: { garment_type: 'shoes' } };
  await post('find-similar', payload);
  assert.equal(searches[0].imageUrl, undefined);
  await post('generate-pairing-image', payload);
  await post('find-similar', payload);
  assert.equal(searches[1].imageUrl, 'https://heytwin.example.com/generated/test-image.png');
  assert.equal(searches[1].attributes.garment_type, 'jeans');
  const asset = await fetch(url + '/generated/test-image.png');
  assert.equal(asset.headers.get('content-type'), 'image/png');
  assert.equal((await fetch(url + '/generated/manifest.json')).status, 404);
  assert.equal((await fetch(url + '/generated/https://example.com')).status, 404);
});

test('public image URL only combines public HTTPS origin and constrained generated references', () => {
  for (const origin of ['http://example.com', 'https://localhost', 'https://127.0.0.1', 'https://10.0.0.1', 'https://user:secret@example.com', 'https://example.com/path']) assert.equal(publicImageURL(origin, '/generated/test.png'), undefined);
  assert.equal(publicImageURL('https://example.com', '/catalogue/test.png'), undefined);
  assert.equal(publicImageURL('https://example.com', '/generated/test.glb'), undefined);
});

test('localhost search checks only the registered generated image and reuses its visual attributes', async t => {
  const storageDir = await fs.mkdtemp(path.join(os.tmpdir(), 'heytwin-search-api-'));
  t.after(() => fs.rm(storageDir, { recursive: true, force: true }));
  const generatedBytes = Buffer.from('distinct generated garment fixture');
  const checks = [];
  const searchProfile = createSearchProfile({ storageDir, provider: async (prompt, image) => {
    checks.push(image);
    return { usable: true, attributes: { garment_type: { value: 'jeans', confidence: .99 }, colour: { value: 'dark blue', confidence: .95 } } };
  } });
  const { post, prepare, searches } = await appFor(t, { searchProfile, generatedBytes, env: {} });
  const { garment_id, outfits } = await prepare();
  const payload = { garment_id, pairing_id: outfits[0].pairing_id, image: png, imageUrl: 'https://untrusted.example/image.png', attributes: { colour: 'red' } };
  await post('find-similar', payload);
  assert.equal(checks.length, 0);
  await post('generate-pairing-image', payload);
  for (let i = 0; i < 2; i++) {
    const result = await post('find-similar', payload);
    assert.equal(result.status, 200);
    assert.equal(result.data.search_basis, 'generated_image');
    assert.deepEqual(result.data.image_checked_fields, ['garment_type', 'colour']);
    assert.equal(searches.at(-1).attributes.colour, 'dark blue');
    assert.equal(searches.at(-1).imageUrl, undefined);
  }
  assert.deepEqual(checks, [`data:image/png;base64,${generatedBytes.toString('base64')}`]);
  assert.notEqual(checks[0], png);
});

test('failed generated-asset storage cannot break the original recommendation response', async t => {
  const app = createApp({ env: {}, provider, generation: { state: async () => { throw new Error('Disk unavailable'); }, close() {} } }).listen(0, '127.0.0.1');
  await once(app, 'listening');
  t.after(() => new Promise(resolve => app.close(resolve)));
  const post = async (route, body) => {
    const response = await fetch(`http://127.0.0.1:${app.address().port}/api/${route}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    assert.equal(response.status, 200);
    return response.json();
  };
  const { garment_id } = await post('analyze-garment', { image: png });
  await post('confirm-garment', { garment_id, corrected_attributes: confirmed });
  const result = await post('recommend-outfits', { garment_id });
  assert.equal(result.outfits.length, 3);
  assert.equal(result.outfits[0].generation.image.code, 'ASSET_STORAGE_UNAVAILABLE');
  assert.ok(result.outfits[0].explanation);
});
