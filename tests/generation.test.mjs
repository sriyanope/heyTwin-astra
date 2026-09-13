import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createGenerationService } from '../lib/generation.mjs';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a2ioAAAAASUVORK5CYII=', 'base64');
const image = `data:image/png;base64,${png.toString('base64')}`;
const imageOutput = (encoded = png.toString('base64')) => ({ status: 'completed', output: [{ type: 'image_generation_call', status: 'completed', result: encoded }] });
const context = (pairing_id = 'pair-a') => ({ pairing_id, image_hash: 'upload-sha', attributes: { category: 'bottom', garment_type: 'trousers', colour: 'indigo', pattern: 'solid', material: 'denim', silhouette: 'straight-leg', length: 'full', details: 'five-pocket' }, original_attributes: { category: 'top', colour: 'ivory', pattern: 'floral', silhouette: 'peplum' } });
const response = (body, status = 200, headers = {}) => ({ ok: status >= 200 && status < 300, status, headers: { get: key => headers[key.toLowerCase()] || null }, json: async () => body, arrayBuffer: async () => body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) });
async function temporary(t) { const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'heytwin-generation-')); t.after(() => fs.rm(dir, { recursive: true, force: true })); return dir; }
async function eventually(check, milliseconds = 600) { const end = Date.now() + milliseconds; let last; while (Date.now() < end) { try { return await check(); } catch (error) { last = error; await new Promise(resolve => setTimeout(resolve, 5)); } } throw last; }

test('generated garment images cache by attributes and return persisted opaque assets', async t => {
  const storageDir = await temporary(t); let calls = 0;
  const service = createGenerationService({ storageDir, env: { IMAGE_API_KEY: 'test' }, fetchImpl: async (url, options) => {
    calls++; assert.equal(String(url), 'https://api.openai.com/v1/responses');
    const request = JSON.parse(options.body);
    assert.equal(request.model, 'gpt-5.6-terra'); assert.equal(request.tools[0].model, 'gpt-image-1.5');
    assert.equal(request.store, false); assert.deepEqual(request.tool_choice, { type: 'image_generation' }); return response(imageOutput());
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
  const service = createGenerationService({ storageDir, env: { OPENAI_API_KEY: 'test' }, fetchImpl: async (url, options) => { body = JSON.parse(options.body); assert.equal(String(url), 'https://api.openai.com/v1/responses'); return response(imageOutput()); } });
  await service.start('preview', context(), { image });
  await eventually(async () => assert.equal((await service.state(context())).preview.status, 'succeeded'));
  assert.equal(body.model, 'gpt-5.6-terra'); assert.equal(body.tools[0].model, 'gpt-image-1.5');
  assert.equal(body.tools[0].size, '1024x1536'); assert.equal(body.store, false);
  assert.equal(body.input[0].content[1].image_url, image);
  assert.equal((await fs.readFile(path.join(storageDir, 'manifest.json'), 'utf8')).includes(image), false);
});

test('malformed PNG provider output is rejected before it becomes an asset', async t => {
  const storageDir = await temporary(t); const bad = Buffer.from('not-a-png').toString('base64');
  const imageService = createGenerationService({ storageDir, env: { IMAGE_API_KEY: 'i' }, fetchImpl: async () => response(imageOutput(bad)) });
  await imageService.start('image', context());
  await eventually(async () => { const state = await imageService.state(context()); assert.equal(state.image.status, 'failed'); assert.equal(state.image.code, 'INVALID_PROVIDER_OUTPUT'); });
  await imageService.close();
});

test('accepts a valid streamed image response larger than the ordinary JSON control limit', async t => {
  const storageDir = await temporary(t); const large = Buffer.concat([png, Buffer.alloc(1100 * 1024)]);
  const encoded = Buffer.from(JSON.stringify(imageOutput(large.toString('base64'))));
  const service = createGenerationService({ storageDir, env: { IMAGE_API_KEY: 'i' }, fetchImpl: async () => ({ ok: true, status: 200, body: new ReadableStream({ start(controller) { controller.enqueue(encoded.subarray(0, 700000)); controller.enqueue(encoded.subarray(700000)); controller.close(); } }) }) });
  await service.start('image', context());
  await eventually(async () => assert.equal((await service.state(context())).image.status, 'succeeded'));
});

test('Terra preview includes both references and changing the generation model misses its cache', async t => {
  const storageDir = await temporary(t); const requests = [];
  const env = { VISION_MODEL: 'gpt-6-astra', VISION_API_KEY: 'legacy-key', VISION_API_URL: 'https://api.openai.com/v1/chat/completions' };
  const service = createGenerationService({ storageDir, env, fetchImpl: async (url, options) => {
    assert.equal(options.headers.authorization, 'Bearer legacy-key');
    requests.push(JSON.parse(options.body)); return response(imageOutput());
  } });
  t.after(() => service.close());
  await service.start('image', context());
  await eventually(async () => assert.equal((await service.state(context())).image.status, 'succeeded'));
  await service.start('preview', context(), { image });
  await eventually(async () => assert.equal((await service.state(context())).preview.status, 'succeeded'));
  assert.equal(requests[1].model, 'gpt-5.6-terra');
  assert.equal(requests[1].input[0].content.filter(item => item.type === 'input_image').length, 2);
  assert.match(requests[1].input[0].content[0].text, /featureless face/);
  await service.close();
  const changed = createGenerationService({ storageDir, env: { ...env, GENERATION_MODEL: 'another-configured-model' } });
  t.after(() => changed.close());
  const state = await changed.state(context());
  assert.equal(state.preview.status, 'idle'); assert.equal(state.image.status, 'idle');
});

test('incomplete, refused and missing image-tool results fail without an automatic paid retry', async t => {
  const root = await temporary(t);
  const invalid = [
    { ...imageOutput(), status: 'incomplete' },
    { status: 'completed', output: [{ type: 'message', content: [{ type: 'refusal', refusal: 'Cannot generate' }] }] },
    { status: 'completed', output: [{ type: 'image_generation_call', status: 'failed' }] },
  ];
  for (let i = 0; i < invalid.length; i++) {
    let calls = 0;
    const service = createGenerationService({ storageDir: path.join(root, String(i)), env: { OPENAI_API_KEY: 'test' }, fetchImpl: async () => { calls++; return response(calls === 1 ? invalid[i] : imageOutput()); } });
    t.after(() => service.close());
    await service.start('preview', context(), { image });
    await eventually(async () => { const state = await service.state(context()); assert.equal(state.preview.status, 'failed'); assert.equal(state.preview.code, 'INVALID_PROVIDER_OUTPUT'); });
    await service.start('preview', context(), { image }); assert.equal(calls, 1);
    await service.start('preview', context(), { image, retry: true });
    await eventually(async () => assert.equal((await service.state(context())).preview.status, 'succeeded'));
    assert.equal(calls, 2);
  }
});
test('3D jobs are rejected and cached model assets are no longer exposed', async t=>{
 const storageDir=await temporary(t);
 const filename='a'.repeat(64)+'-'+'b'.repeat(32)+'.glb';
 await fs.writeFile(path.join(storageDir,'manifest.json'),JSON.stringify({records:[['model:old',{kind:'model',status:'pending',provider_task_id:'old-task',filename}]]}));
 let calls=0;
 const service=createGenerationService({storageDir,fetchImpl:async()=>{calls++;throw new Error('must not call');}});
 t.after(()=>service.close());
 assert.deepEqual(Object.keys(await service.state(context())),['image','preview']);
 await assert.rejects(service.start('model',context()),/Unknown generation kind/);
 assert.equal(await service.asset(filename),null);assert.equal(calls,0);
});
test('gender clothing preference reaches the image prompt and separates the garment cache',async t=>{
 const storageDir=await temporary(t);let prompt;
 const service=createGenerationService({storageDir,env:{IMAGE_API_KEY:'test'},fetchImpl:async(url,options)=>{prompt=JSON.parse(options.body).input[0].content[0].text;return response(imageOutput());}});
 t.after(()=>service.close());
 const male=context();male.attributes.styling_gender='man';
 await service.start('image',male);
 await eventually(async()=>assert.equal((await service.state(male)).image.status,'succeeded'));
 assert.match(prompt,/menswear cut/);
 const female=context();female.attributes.styling_gender='woman';
 assert.equal((await service.state(female)).image.status,'idle');
});
