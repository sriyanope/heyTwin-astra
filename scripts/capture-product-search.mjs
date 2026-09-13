// Render saved real search results with a local sample upload; no SerpApi or AI calls.
import fs from 'node:fs/promises';
import { once } from 'node:events';
import sharp from 'sharp';
import { chromium } from '@playwright/test';
import { createApp } from '../server.mjs';
const saved = JSON.parse(await fs.readFile('verification/product-search/live-result.json', 'utf8'));
if (saved.result.status !== 'succeeded' || !saved.result.products.length) throw new Error('Run the live text search first.');
// This review tests search only; other provider features are explicitly unconfigured.
const env = {};
const generation = {
  state: async () => Object.fromEntries(['image', 'preview', 'model'].map(kind => [kind, { status: 'setup_required' }])),
  asset: async () => null, close: async () => {},
  start: async () => { throw new Error('Image and model generation are disabled in this search review.'); },
};
const app = createApp({ env, generation,
  productSearch: { search: async () => ({ ...saved.result, source_state: 'cache' }) },
  provider: async (prompt, image) => image
    ? { usable: true, attributes: { category: { value: 'top', confidence: .9 }, colour: { value: 'blue', confidence: .9 }, pattern: { value: 'solid', confidence: .9 } }, description: 'Blue relaxed collared shirt', confidence: .9, uncertainty: { level: 'low', note: 'Controlled local identification for search review.' } }
    : { outfits: [{ catalogue_item_id: 'olive-trousers', name: 'Blue and olive', explanation: 'Olive tapered trousers complement the blue collared shirt.', confidence: .9 }] },
}).listen(0, '127.0.0.1');
await once(app, 'listening');
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined });
try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 1200 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${app.address().port}`);
  const buffer = await sharp('public/catalogue/blue-shirt.svg').png().toBuffer();
  await page.locator('#image-input').setInputFiles({ name: 'local-sample.png', mimeType: 'image/png', buffer });
  await page.locator('#identify-button').click();
  await page.locator('#details-panel').waitFor();
  await page.locator('#recommend-button').click();
  await page.locator('[data-action="similar"]').click();
  await page.locator('.product').first().waitFor();
  await page.waitForFunction(() => [...document.querySelectorAll('.product-thumb')].every(image => image.complete), null, { timeout: 20000 }).catch(() => {});
  const thumbnails = await page.locator('.product-thumb').evaluateAll(images => ({ loaded: images.filter(image => image.complete && image.naturalWidth > 0).length, pending: images.filter(image => !image.complete).length }));
  const count = await page.locator('.product').count();
  if (count !== saved.result.products.length || errors.length) throw new Error(JSON.stringify({ count, errors }));
  await page.locator('#result-note').evaluate(element => { element.textContent = 'Verification: local sample upload and controlled styling. Listings replay the saved real SerpApi response.'; });
  await page.locator('.similar-panel').evaluate(element => { element.prepend(Object.assign(document.createElement('p'), { textContent: 'Cached real SerpApi listings · description search' })); });
  await page.locator('.similar-panel').screenshot({ path: 'verification/product-search/listings-desktop.png' });
  await page.setViewportSize({ width: 390, height: 1000 });
  if (!await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)) throw new Error('Mobile overflow');
  await page.locator('.similar-panel').screenshot({ path: 'verification/product-search/listings-mobile.png' });
  const links = [];
  if (process.argv.includes('--skip-links')) links.push(...JSON.parse(await fs.readFile('verification/product-search/browser-result.json', 'utf8')).link_checks);
  for (const product of process.argv.includes('--skip-links') ? [] : saved.result.products.slice(0, 2)) {
    const tab = await browser.newPage();
    try {
      const response = await tab.goto(product.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      const body = await tab.locator('body').innerText({ timeout: 5000 });
      links.push({ title: product.title, status: response?.status(), page_title: await tab.title(), blocked: /unusual traffic|not a robot|captcha|access denied/i.test(body) });
    } catch (error) { links.push({ title: product.title, error: error.name }); }
    await tab.close();
  }
  const result = { listings_rendered: count, search_query: saved.result.query, source: 'saved real SerpApi response; local controlled upload/styling', page_errors: errors, thumbnails, mobile_overflow: false, link_checks: links };
  await fs.writeFile('verification/product-search/browser-result.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
} finally { await browser.close(); await new Promise(resolve => app.close(resolve)); await generation.close(); }
