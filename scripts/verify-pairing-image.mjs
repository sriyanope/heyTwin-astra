// One real suggestion-image check. Identification/styling are controlled locally;
// the sample upload NEVER leaves this machine. Only garment text reaches OpenAI.
import fs from 'node:fs/promises';
import { once } from 'node:events';
import sharp from 'sharp';
import { chromium } from '@playwright/test';
import { createApp, loadEnv } from '../server.mjs';
import { createGenerationService } from '../lib/generation.mjs';

const env = loadEnv();
// Isolate this verifier from the running app's single-writer manifest.
const storageDir = 'data/image-verification-cache';
await fs.mkdir(storageDir, { recursive: true });
try { await fs.access(`${storageDir}/manifest.json`); }
catch (error) {
  if (error.code !== 'ENOENT') throw error;
  let records = [];
  try {
    const manifest = JSON.parse(await fs.readFile('data/generated/manifest.json', 'utf8'));
    records = manifest.records.filter(([, record]) => record.kind === 'image' && record.status === 'succeeded' && /^[a-f0-9-]+\.png$/.test(record.filename));
    for (const [, record] of records) await fs.copyFile(`data/generated/${record.filename}`, `${storageDir}/${record.filename}`);
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  await fs.writeFile(`${storageDir}/manifest.json`, JSON.stringify({ version: 1, records }));
}
let providerCalls = 0;
const generation = createGenerationService({ env, storageDir, fetchImpl: async (url, options) => {
  if (String(url) !== 'https://api.openai.com/v1/images/generations' || options.method !== 'POST' || options.body.includes('data:image')) throw new Error('Verification only permits text-only image generation.');
  if (++providerCalls > 1) throw new Error('Only one image-generation call is allowed.');
  return fetch(url, options);
} });
const provider = async (prompt, image) => image
  ? { usable: true, attributes: { category: { value: 'top', confidence: .9 }, colour: { value: 'blue', confidence: .9 }, pattern: { value: 'solid', confidence: .9 } }, description: 'Blue relaxed collared shirt', confidence: .9, uncertainty: { level: 'low', note: 'Local sample identification for image-generation verification.' } }
  : { outfits: [{ catalogue_item_id: 'cream-trousers', name: 'Blue and cream', explanation: 'Cream wide-leg trousers complement the blue collared shirt.', confidence: .9 }] };
const app = createApp({ env, provider, generation }).listen(0, '127.0.0.1');
await once(app, 'listening');
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined });
try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 1100 } });
  const errors = [], generationRequests = [], failedResponses = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (request.url().endsWith('/api/generate-pairing-image')) generationRequests.push(request.url()); });
  page.on('response', response => { if (response.status() >= 400 && response.url().includes('/api/')) failedResponses.push({ status: response.status(), route: new URL(response.url()).pathname }); });
  await page.goto(`http://127.0.0.1:${app.address().port}`);
  const buffer = await sharp('public/catalogue/blue-shirt.svg').png().toBuffer();
  await page.locator('#image-input').setInputFiles({ name: 'local-sample-shirt.png', mimeType: 'image/png', buffer });
  await page.locator('#identify-button').click();
  await page.locator('#details-panel').waitFor({ state: 'visible' });
  await page.locator('#recommend-button').click();
  await page.locator('.outfit-card').waitFor();
  await page.waitForFunction(() => {
    const card = document.querySelector('.outfit-card');
    return card?.querySelector('.piece:nth-child(2) img[src^="/generated/"]') || card?.querySelector('.job-failed, .job-setup_required');
  }, null, { timeout: 240000 });
  const generated = page.locator('.piece:nth-child(2) img');
  if (!await generated.count()) throw new Error(await page.locator('.outfit-card').innerText());
  await page.waitForFunction(() => { const image = document.querySelector('.piece:nth-child(2) img'); return image?.complete && image.naturalWidth > 0; });
  const source = await generated.getAttribute('src');
  const own = page.locator('.piece:first-child img');
  if (await own.getAttribute('src') !== await page.locator('#preview').getAttribute('src')) throw new Error('Original changed');
  const ownBox = await own.boundingBox(), generatedBox = await generated.boundingBox();
  if (generatedBox.x <= ownBox.x || Math.abs(generatedBox.y - ownBox.y) > 5 || errors.length || failedResponses.length) throw new Error(JSON.stringify({ ownBox, generatedBox, errors, failedResponses }));
  const evidenceDir = 'verification/image-generation';
  await fs.mkdir(evidenceDir, { recursive: true });
  await page.locator('#result-note').evaluate(element => { element.textContent = 'Verification: local sample shirt and controlled styling. The trousers image comes from the real image-generation adapter.'; });
  await page.locator('#results').screenshot({ path: `${evidenceDir}/pairing-desktop.png` });
  await page.setViewportSize({ width: 390, height: 1000 });
  if (!await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)) throw new Error('Mobile overflow');
  await page.locator('.outfit-card').screenshot({ path: `${evidenceDir}/pairing-mobile.png` });
  const result = { checked_at: new Date().toISOString(), original_and_styling: 'controlled local sample; no uploaded photo sent to any provider', generated_image: source, image_provenance: await page.locator('.outfit-card .job-badge').innerText(), provider_calls: providerCalls, automatic_generation_requests: generationRequests.length, original_unchanged: true, images_side_by_side: true, console_errors: errors, failed_api_responses: failedResponses };
  await fs.writeFile(`${evidenceDir}/result.json`, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close(); await new Promise(resolve => app.close(resolve)); await generation.close();
}
