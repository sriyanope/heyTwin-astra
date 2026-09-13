// Render an already generated GLB locally. No provider requests or credentials are used.
import fs from 'node:fs/promises';
import path from 'node:path';
import { once } from 'node:events';
import { chromium } from '@playwright/test';
import { createApp } from '../server.mjs';
import { createGenerationService } from '../lib/generation.mjs';

const reportFile = process.argv[2] || 'test-results/outfit-live-results.json';
const outputDir = path.dirname(reportFile);
const report = JSON.parse(await fs.readFile(reportFile, 'utf8'));
const asset = report.checks?.model?.asset_url;
if (report.checks?.model?.status !== 'succeeded' || !/^\/generated\/[a-f0-9-]+\.glb$/.test(asset)) throw new Error('First complete the live text-model check.');
const generation = createGenerationService({ env: {} });
const app = createApp({ env: {}, generation }).listen(0, '127.0.0.1');
await once(app, 'listening');
const origin = `http://127.0.0.1:${app.address().port}`;
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined, args: ['--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage({ viewport: { width: 1000, height: 1000 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(origin);
  await page.evaluate(async ({ asset, description }) => {
    document.body.innerHTML = '<main style="max-width:920px;margin:auto;padding:24px;font-family:Arial,sans-serif;color:#162b48"><h1 style="font-size:28px">Simplified outfit in 3D</h1><p id="outfit-description"></p><p>OpenAI-assisted garment parameters · Fixed neutral mannequin · Not a fit prediction</p><model-viewer camera-controls shadow-intensity="1" exposure="1" style="display:block;width:100%;height:710px;background:#f6eedc;border:2px solid #162b48;border-radius:16px"></model-viewer><p>Live OpenAI text response, built locally into a GLB. Patterns and fine details are simplified.</p></main>';
    document.querySelector('#outfit-description').textContent = description;
    await import('/vendor/model-viewer.min.js');
    const viewer = document.querySelector('model-viewer');
    viewer.setAttribute('src', asset); viewer.setAttribute('camera-orbit', '0deg 80deg 105%');
    await new Promise((resolve, reject) => { viewer.addEventListener('load', resolve, { once: true }); viewer.addEventListener('error', () => reject(new Error('GLB did not load')), { once: true }); });
  }, { asset, description: report.original_description || (report.reference?.includes('blue-shirt') ? 'Light blue short-sleeve shirt + indigo straight-leg jeans' : 'White short-sleeve T-shirt + indigo straight-leg jeans') });
  for (const [name, theta] of [['front', 0], ['side', 90], ['back', 180]]) {
    await page.locator('model-viewer').evaluate((viewer, theta) => { viewer.cameraOrbit = `${theta}deg 80deg 105%`; viewer.jumpCameraToGoal(); }, theta);
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outputDir, `openai-model-${name}.png`) });
  }
  await page.locator('model-viewer').evaluate(viewer => { viewer.cameraOrbit = '0deg 80deg 105%'; viewer.jumpCameraToGoal(); });
  const before = await page.locator('model-viewer').evaluate(viewer => ({ theta: viewer.getCameraOrbit().theta, radius: viewer.getCameraOrbit().radius }));
  const box = await page.locator('model-viewer').boundingBox();
  await page.mouse.move(box.x + box.width * .6, box.y + box.height * .5);
  await page.mouse.down(); await page.mouse.move(box.x + box.width * .3, box.y + box.height * .5, { steps: 12 }); await page.mouse.up();
  await page.waitForTimeout(600);
  await page.mouse.wheel(0, -250); await page.waitForTimeout(600);
  const after = await page.locator('model-viewer').evaluate(viewer => ({ theta: viewer.getCameraOrbit().theta, radius: viewer.getCameraOrbit().radius, loaded: viewer.loaded }));
  if (!after.loaded || Math.abs(after.theta - before.theta) < .1 || Math.abs(after.radius - before.radius) < .01 || errors.length) throw new Error(JSON.stringify({ before, after, errors }));
  const result = { asset_url: asset, loaded: after.loaded, drag_rotates: true, wheel_zooms: true, page_errors: errors, screenshots: ['front', 'side', 'back'].map(view => path.join(outputDir, `openai-model-${view}.png`)) };
  await fs.writeFile(path.join(outputDir, 'openai-model-browser.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close(); await new Promise(resolve => app.close(resolve)); await generation.close();
}
