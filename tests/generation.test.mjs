import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createGenerationService } from '../lib/generation.mjs';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a2ioAAAAASUVORK5CYII=', 'base64');
const image = `data:image/png;base64,${png.toString('base64')}`;
const glbJson = Buffer.from('{"asset":{"version":"2.0"}}');
const glb = (() => { const padded = Buffer.concat([glbJson, Buffer.alloc((4 - glbJson.length % 4) % 4, 0x20)]); const out = Buffer.alloc(20 + padded.length); out.write('glTF'); out.writeUInt32LE(2, 4); out.writeUInt32LE(out.length, 8); out.writeUInt32LE(padded.length, 12); out.writeUInt32LE(0x4E4F534A, 16); padded.copy(out, 20); return out; })();
const context = (pairing_id = 'pair-a') => ({ pairing_id, image_hash: 'upload-sha', attributes: { category: 'bottom', garment_type: 'trousers', colour: 'indigo', pattern: 'solid', material: 'denim', silhouette: 'straight-leg', length: 'full', details: 'five-pocket' }, original_attributes: { category: 'top', colour: 'ivory', pattern: 'floral', silhouette: 'peplum' } });
const response = (body, status = 200, headers = {}) => ({ ok: status >= 200 && status < 300, status, headers: { get: key => headers[key.toLowerCase()] || null }, json: async () => body, arrayBuffer: async () => body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) });
async function temporary(t) { const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'heytwin-generation-')); t.after(() => fs.rm(dir, { recursive: true, force: true })); return dir; }
async function eventually(check, milliseconds = 600) { const end = Date.now() + milliseconds; let last; while (Date.now() < end) { try { return await check(); } catch (error) { last = error; await new Promise(resolve => setTimeout(resolve, 5)); } } throw last; }

test('generated garment images cache by attributes and return persisted opaque assets', async t => {
  const storageDir = await temporary(t); let calls = 0;
  const service = createGenerationService({ storageDir, env: { IMAGE_API_KEY: 'test' }, fetchImpl: async (url, options) => {
    calls++; assert.equal(String(url), 'https://api.openai.com/v1/images/generations');
    assert.equal(JSON.parse(options.body).model, 'gpt-image-1.5'); return response({ data: [{ b64_json: png.toString('base64') }] });
  } });
  assert.equal((await service.start('image', context())).image.status, 'pending');
  const complete = await eventually(async () => { const value = await service.state(context()); assert.equal(value.image.status, 'succeeded'); return value; });
  const second = await service.start('image', context('same-garment-another-pair'));
  assert.equal(second.image.asset_url, complete.image.asset_url); assert.equal(calls, 1);
  const file = complete.image.asset_url.split('/').at(-1); const asset = await service.asset(file);
  assert.deepEqual(asset.data, png); assert.equal(asset.contentType, 'image/png'); assert.equal(await service.asset('../../manifest.json'), null);
  const restarted = createGenerationService({ storageDir, env: {} });
  assert.equal((await restarted.state(context())).image.source_state, 'cache');
  const changedSettings = createGenerationService({ storageDir, env: { IMAGE_API_KEY: 'test', IMAGE_MODEL: 'gpt-image-1' } });
  assert.equal((await changedSettings.state(context())).image.status, 'idle');
});

test('preview uses the original only as a transient image-edit reference and requires setup when absent', async t => {
  const storageDir = await temporary(t); let body;
  const missing = createGenerationService({ storageDir: path.join(storageDir, 'missing'), env: {} });
  await missing.start('preview', context(), { image });
  assert.equal((await eventually(async () => { const s = await missing.state(context()); assert.equal(s.preview.status, 'setup_required'); return s; })).preview.code, 'PROVIDER_NOT_CONFIGURED');
  const service = createGenerationService({ storageDir, env: { OPENAI_API_KEY: 'test' }, fetchImpl: async (url, options) => { body = options.body; assert.equal(String(url), 'https://api.openai.com/v1/images/edits'); return response({ data: [{ b64_json: png.toString('base64') }] }); } });
  await service.start('preview', context(), { image });
  await eventually(async () => assert.equal((await service.state(context())).preview.status, 'succeeded'));
  assert.equal(body.get('model'), 'gpt-image-1.5'); assert.equal(body.getAll('image[]')[0].size, png.length);
  assert.equal((await fs.readFile(path.join(storageDir, 'manifest.json'), 'utf8')).includes(image), false);
});

test('duplicate model actions issue one Meshy create request and poll to a downloaded GLB', async t => {
  const storageDir = await temporary(t); let creates = 0; let checks = 0;
  const service = createGenerationService({ storageDir, env: { IMAGE_API_KEY: 'i', MESHY_API_KEY: 'm', MODEL_3D_PROVIDER:'meshy', MESHY_POLL_MS: 25 }, fetchImpl: async (url, options) => {
    const target = String(url);
    if (target.endsWith('/images/generations') || target.endsWith('/images/edits')) return response({ data: [{ b64_json: png.toString('base64') }] });
    if (target.endsWith('/image-to-3d') && options.method === 'POST') { creates++; return response({ result: 'mesh-task' }); }
    if (target.endsWith('/image-to-3d/mesh-task')) { checks++; return response({ status: checks === 1 ? 'IN_PROGRESS' : 'SUCCEEDED', model_urls: { glb: 'https://assets.meshy.ai/demo/model.glb?token=only-provider-knows' } }); }
    if (target.startsWith('https://assets.meshy.ai/')) return response(glb, 200, { 'content-length': String(glb.length) });
    throw new Error(`unexpected ${target}`);
  } });
  await service.start('preview', context(), { image }); await eventually(async () => assert.equal((await service.state(context())).preview.status, 'succeeded'));
  await Promise.all([service.start('model', context()), service.start('model', context())]);
  const done = await eventually(async () => { const value = await service.state(context()); assert.equal(value.model.status, 'succeeded'); return value; });
  assert.equal(creates, 1); assert.ok(checks >= 2); assert.deepEqual((await service.asset(done.model.asset_url.split('/').at(-1))).data, glb);
});

test('Meshy failure is retryable, timeout is bounded, and a restart only resumes the existing task', async t => {
  const storageDir = await temporary(t); let creates = 0; let checks = 0;
  const common = { storageDir, env: { IMAGE_API_KEY: 'i', MESHY_API_KEY: 'm', MODEL_3D_PROVIDER:'meshy', MESHY_POLL_MS: 25, MESHY_MAX_POLLS: 1 } };
  const fetcher = async (url, options) => {
    const target = String(url);
    if (target.endsWith('/images/generations') || target.endsWith('/images/edits')) return response({ data: [{ b64_json: png.toString('base64') }] });
    if (target.endsWith('/image-to-3d') && options.method === 'POST') { creates++; return response({ result: 'saved-task' }); }
    if (target.endsWith('/image-to-3d/saved-task')) { checks++; return response({ status: checks === 1 ? 'IN_PROGRESS' : 'SUCCEEDED', model_urls: { glb: 'https://assets.meshy.ai/saved.glb' } }); }
    if (target.startsWith('https://assets.meshy.ai/')) return response(glb, 200, { 'content-length': String(glb.length) });
    throw new Error('unexpected call');
  };
  const first = createGenerationService({ ...common, fetchImpl: fetcher });
  await first.start('preview', context(), { image }); await eventually(async () => assert.equal((await first.state(context())).preview.status, 'succeeded'));
  await first.start('model', context()); await eventually(async () => assert.equal((await first.state(context())).model.status, 'failed'));
  assert.equal((await first.start('model', context())).model.status, 'failed');
  await first.start('model', context(), { retry: true }); await eventually(async () => assert.equal((await first.state(context())).model.status, 'succeeded'));
  assert.equal(creates, 1); // retry resumes the existing non-terminal task instead of buying a second task
  await first.close();
  // Simulate restart while an old task is in-flight: state polls it; no POST is made.
  const manifest = JSON.parse(await fs.readFile(path.join(storageDir, 'manifest.json'), 'utf8')); const entry = manifest.records.find(([key]) => key.startsWith('model:'));
  entry[1] = { ...entry[1], status: 'processing', provider_task_id: 'saved-task' }; await fs.writeFile(path.join(storageDir, 'manifest.json'), JSON.stringify(manifest));
  const restarted = createGenerationService({ ...common, fetchImpl: fetcher }); await restarted.state(context());
  await eventually(async () => assert.equal((await restarted.state(context())).model.status, 'succeeded'));
  assert.equal(creates, 1);
});

test('untrusted redirects, non-GLB bytes, and provider timeout become safe retryable failures', async t => {
  const storageDir = await temporary(t);
  const service = createGenerationService({ storageDir, env: { IMAGE_API_KEY: 'i', MESHY_API_KEY: 'm', MODEL_3D_PROVIDER:'meshy' }, fetchImpl: async (url, options) => {
    const target = String(url);
    if (target.endsWith('/images/generations') || target.endsWith('/images/edits')) return response({ data: [{ b64_json: png.toString('base64') }] });
    if (target.endsWith('/image-to-3d') && options.method === 'POST') return response({ result: 'unsafe' });
    if (target.endsWith('/image-to-3d/unsafe')) return response({ status: 'SUCCEEDED', model_urls: { glb: 'https://evil.invalid/escape.glb' } });
  } });
  await service.start('preview', context(), { image }); await eventually(async () => assert.equal((await service.state(context())).preview.status, 'succeeded'));
  await service.start('model', context());
  const result = await eventually(async () => { const state = await service.state(context()); assert.equal(state.model.status, 'failed'); return state; });
  assert.equal(result.model.retryable, true); assert.equal(result.model.code, 'INVALID_PROVIDER_OUTPUT');
});

test('malformed PNG and GLB provider output is rejected before it becomes an asset', async t => {
  const storageDir = await temporary(t); const bad = Buffer.from('not-a-png').toString('base64');
  const imageService = createGenerationService({ storageDir, env: { IMAGE_API_KEY: 'i' }, fetchImpl: async () => response({ data: [{ b64_json: bad }] }) });
  await imageService.start('image', context());
  await eventually(async () => { const state = await imageService.state(context()); assert.equal(state.image.status, 'failed'); assert.equal(state.image.code, 'INVALID_PROVIDER_OUTPUT'); });
  const modelService = createGenerationService({ storageDir: path.join(storageDir, 'model'), env: { IMAGE_API_KEY: 'i', MESHY_API_KEY: 'm', MODEL_3D_PROVIDER:'meshy' }, fetchImpl: async (url, options) => {
    const target = String(url);
    if (target.endsWith('/images/edits')) return response({ data: [{ b64_json: png.toString('base64') }] });
    if (target.endsWith('/image-to-3d') && options.method === 'POST') return response({ result: 'bad-glb' });
    if (target.endsWith('/image-to-3d/bad-glb')) return response({ status: 'SUCCEEDED', model_urls: { glb: 'https://assets.meshy.ai/x.glb' } });
    return response(Buffer.from('glTF-but-not-a-v2-file'), 200, { 'content-length': '22' });
  } });
  await modelService.start('preview', context(), { image }); await eventually(async () => assert.equal((await modelService.state(context())).preview.status, 'succeeded'));
  await modelService.start('model', context());
  await eventually(async () => { const state = await modelService.state(context()); assert.equal(state.model.status, 'failed'); assert.equal(state.model.code, 'INVALID_PROVIDER_OUTPUT'); });
});

test('accepts a valid streamed image response larger than the ordinary JSON control limit', async t => {
  const storageDir = await temporary(t); const large = Buffer.concat([png, Buffer.alloc(1100 * 1024)]);
  const encoded = Buffer.from(JSON.stringify({ data: [{ b64_json: large.toString('base64') }] }));
  const service = createGenerationService({ storageDir, env: { IMAGE_API_KEY: 'i' }, fetchImpl: async () => ({ ok: true, status: 200, body: new ReadableStream({ start(controller) { controller.enqueue(encoded.subarray(0, 700000)); controller.enqueue(encoded.subarray(700000)); controller.close(); } }) }) });
  await service.start('image', context());
  await eventually(async () => assert.equal((await service.state(context())).image.status, 'succeeded'));
});

test('default 3D provider uses OpenAI parameters without a preview or Meshy request', async t => {
  const storageDir = await temporary(t); let calls = [], request;
  const spec = { top:{type:'blouse',colour:'#f0dfc0',sleeves:'long',silhouette:'peplum'}, bottom:{type:'trousers',colour:'#405976',silhouette:'straight',length:'full'} };
  const service = createGenerationService({ storageDir, env:{ MODEL_3D_MODEL:'gpt-5.6-terra', OPENAI_API_KEY:'key', MESHY_API_KEY:'paid-key' }, fetchImpl:async(url, options) => { calls.push(String(url)); request=JSON.parse(options.body); return response({choices:[{message:{content:JSON.stringify(spec)}}]}); } });
  assert.equal((await service.state(context())).model.method,'openai-parametric');
  await service.start('model', context());
  const done=await eventually(async()=>{const state=await service.state(context());assert.equal(state.model.status,'succeeded');return state;});
  assert.equal(done.model.method,'openai-parametric'); assert.deepEqual(calls,['https://api.openai.com/v1/chat/completions']);
  assert.equal(request.response_format.type,'json_schema'); assert.match(JSON.stringify(request.response_format),/top/); assert.match(request.messages[1].content,/original_attributes/); assert.doesNotMatch(request.messages[1].content,/data:image|base64/i);
  const body = JSON.parse((await fs.readFile(path.join(storageDir,'manifest.json'),'utf8'))); assert.doesNotMatch(JSON.stringify(body),/data:image/);
  await service.start('model', context()); assert.equal(calls.length,1);
});

test('OpenAI parametric 3D rejects arbitrary model output', async t => {
  const storageDir=await temporary(t);
  const service=createGenerationService({storageDir,env:{VISION_MODEL:'gpt-5.6-terra',VISION_MODEL_API_KEY:'key',VISION_MODEL_BASE_URL:'https://api.openai.com/v1'},fetchImpl:async()=>response({choices:[{message:{content:'{"code":"rm -rf /"}'}}]})});
  await service.start('model',context());
  await eventually(async()=>{const state=await service.state(context());assert.equal(state.model.status,'failed');assert.equal(state.model.code,'INVALID_PROVIDER_OUTPUT');});
});
