import { test, expect } from '@playwright/test';
import sharp from 'sharp';

async function uploadPairings(page, description) {
  const buffer = await sharp('public/catalogue/blue-shirt.svg').png().toBuffer();
  await page.goto('/');
  await page.locator('#image-input').setInputFiles({ name: 'fixture-shirt.png', mimeType: 'image/png', buffer });
  await page.locator('#identify-button').click();
  await expect(page.locator('#details-panel')).toBeVisible();
  if (description) await page.locator('#description').fill(description);
  await page.locator('#recommend-button').click();
  await expect(page.locator('.outfit-card')).toHaveCount(3);
  return buffer;
}
const card = (page, index) => page.locator('.outfit-card').nth(index);

test('all three pairings generate isolated images, show honest product fixtures, and retain their own 2D previews', async ({ page }) => {
  test.setTimeout(120000);
  const errors = [], failed = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => { if (request.failure()?.errorText !== 'net::ERR_ABORTED') failed.push(request.url()); });
  await page.setViewportSize({ width: 1280, height: 1000 });
  await uploadPairings(page);
  const original = await page.locator('#preview').getAttribute('src');
  const sources = [];
  for (let index = 0; index < 3; index++) {
    await expect(card(page, index).locator('.piece:nth-child(2) img')).toHaveAttribute('src', /\/generated\//, { timeout: 12000 });
    expect(await card(page, index).locator('.piece:first-child img').getAttribute('src')).toBe(original);
    await card(page, index).locator('[data-action="similar"]').click();
    await expect(card(page, index).getByRole('heading', { name: 'Similar pieces' })).toBeVisible();
    await expect(card(page, index).locator('.product')).toHaveCount(2);
    await expect(card(page, index).locator('.price')).toHaveCount(1);
    await card(page, index).locator('[data-action="preview"]').click();
    await expect(page.locator('#outfit-dialog')).toBeVisible();
    if (await page.locator('#preview-controls button').count()) await page.locator('#preview-controls button').click();
    await expect(page.locator('.outfit-preview-image')).toBeVisible({ timeout: 12000 });
    await expect(page.locator('model-viewer, #model-controls')).toHaveCount(0);
    sources.push(await page.locator('.outfit-preview-image').getAttribute('src'));
    await page.getByRole('button', { name: 'Close outfit preview' }).click();
    await expect(card(page, index).locator('[data-action="preview"]')).toBeFocused();
  }
  expect(new Set(sources).size).toBe(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('#results').screenshot({ path: 'test-results/features-cards-products-desktop.png' });
  expect(errors).toEqual([]);
  expect(failed).toEqual([]);
});

test('mobile preview keyboard focus, failure retry, empty results and stale pairing responses', async ({ page }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 320, height: 844 });
  await uploadPairings(page, 'Blue relaxed collared shirt mobile error fixture');
  let fail = true;
  await page.route('**/api/preview-outfit', async route => {
    if (fail) { fail = false; return route.fulfill({ status: 502, contentType: 'application/json', body: JSON.stringify({ error: { message: 'Preview temporarily unavailable. Please retry.' } }) }); }
    return route.continue();
  });
  await card(page, 0).locator('[data-action="preview"]').click();
  // Fresh image hash is shared intentionally; a cached fixture may already exist.
  if (await page.locator('#preview-controls button').count()) {
    await page.locator('#preview-controls button').click();
    await expect(page.locator('#dialog-status')).toContainText('temporarily unavailable');
    await page.locator('#preview-controls button').click();
  }
  await expect(page.locator('.outfit-preview-image')).toBeVisible({ timeout: 12000 });
  expect(await page.locator('#outfit-dialog').evaluate(dialog => dialog.scrollWidth <= dialog.clientWidth)).toBe(true);
  await page.locator('#outfit-dialog').screenshot({ path: 'test-results/outfit-preview-mobile.png' });
  await page.keyboard.press('Escape');
  await expect(page.locator('#outfit-dialog')).toBeHidden();
  await expect(card(page, 0).locator('[data-action="preview"]')).toBeFocused();

  await page.route('**/api/find-similar', async route => {
    const firstId = await card(page, 0).getAttribute('data-pairing-id');
    if (route.request().postDataJSON().pairing_id === firstId) await new Promise(resolve => setTimeout(resolve, 350));
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ status: 'succeeded', products: [], method: 'text', source_state: 'sample' }) });
  });
  await card(page, 0).locator('[data-action="similar"]').click();
  await card(page, 1).locator('[data-action="similar"]').click();
  await expect(card(page, 0).locator('.similar-panel')).toContainText('No close matches');
  await expect(card(page, 1).locator('.similar-panel')).toContainText('No close matches');
  await expect(card(page, 2).locator('.similar-panel')).toHaveCount(0);
  await page.locator('#results').screenshot({ path: 'test-results/features-mobile-empty.png' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('refresh reupload recovers generated assets without new jobs; reset ignores late responses', async ({ page }) => {
  test.setTimeout(45000);
  await uploadPairings(page);
  const generated = card(page, 0).locator('.piece:nth-child(2) img');
  if (!(await generated.getAttribute('src')).startsWith('/generated/')) {
    await expect(generated).toHaveAttribute('src', /\/generated\//, { timeout: 12000 });
  }
  const source = await generated.getAttribute('src');
  const creates = [];
  page.on('request', request => { if (request.url().endsWith('/api/generate-pairing-image')) creates.push(request.url()); });
  await page.reload();
  await expect(page.locator('#preview-wrap')).toBeHidden();
  await uploadPairings(page);
  await expect(card(page, 0).locator('.piece:nth-child(2) img')).toHaveAttribute('src', source);
  expect(creates).toEqual([]);
  await page.route('**/api/find-similar', async route => { await new Promise(resolve => setTimeout(resolve, 300)); await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ status: 'succeeded', products: [], method: 'text' }) }); });
  await card(page, 0).locator('[data-action="similar"]').click();
  await page.locator('#another-button').click();
  await page.waitForTimeout(500);
  await expect(page.locator('#results')).toBeHidden();
  await expect(page.locator('.outfit-card')).toHaveCount(0);
});

test('images start automatically, preserve the upload, and failed requests wait for manual retry', async ({ page }) => {
  test.setTimeout(45000);
  const creates = new Map();
  let failedId;
  await page.route('**/api/generate-pairing-image', async route => {
    const id = route.request().postDataJSON().pairing_id;
    creates.set(id, (creates.get(id) || 0) + 1);
    if (!failedId) failedId = id;
    if (id === failedId && creates.get(id) === 1) {
      await route.fulfill({ status: 502, contentType: 'application/json', body: JSON.stringify({ error: { code: 'PROVIDER_ERROR', message: 'Image generation failed. Please retry.' } }) });
    } else await route.continue();
  });
  await uploadPairings(page, 'Automatic image regression fixture');
  await expect.poll(() => creates.size).toBe(3);
  const failed = page.locator(`.outfit-card[data-pairing-id="${failedId}"]`);
  const original = await page.locator('#preview').getAttribute('src');
  await expect(failed.locator('[data-action="image"]')).toHaveText('Retry image');
  await expect(failed.locator('.image-placeholder')).toContainText('failed');
  // Another action rerenders cards; it must not buy another image or retry the failure.
  await failed.locator('[data-action="similar"]').click();
  await expect(failed.locator('.similar-panel')).toBeVisible();
  expect([...creates.values()]).toEqual([1, 1, 1]);
  await failed.locator('[data-action="image"]').click();
  await expect.poll(() => creates.get(failedId)).toBe(2);
  for (let index = 0; index < 3; index++) {
    const item = card(page, index);
    await expect(item.locator('.piece:nth-child(2) img')).toHaveAttribute('src', /^\/generated\//, { timeout: 12000 });
    await expect(item.locator('.piece:first-child img')).toHaveAttribute('src', original);
    const ownBox = await item.locator('.piece:first-child').boundingBox();
    const suggestedBox = await item.locator('.piece:nth-child(2)').boundingBox();
    expect(suggestedBox.x).toBeGreaterThan(ownBox.x);
    expect(Math.abs(suggestedBox.y - ownBox.y)).toBeLessThan(2);
  }
});

test('similar search shows its description, loading state, and actionable failure before retrying', async ({ page }) => {
  let calls = 0;
  await page.route('**/api/find-similar', async route => {
    calls++;
    await new Promise(resolve => setTimeout(resolve, 600));
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(calls === 1
      ? { status: 'failed', method: 'text', query: 'indigo straight leg jeans', code: 'SEARCH_TIMEOUT', products: [], message: 'Product search took too long. Please try again.' }
      : { status: 'succeeded', method: 'text', query: 'indigo straight leg jeans', products: [], source_state: 'sample', search_basis: 'generated_image', image_checked_fields: ['garment_type', 'colour'], message: 'No similar pieces were found.' }) });
  });
  await uploadPairings(page, 'Search failure regression fixture');
  const first = card(page, 0);
  await first.locator('[data-action="similar"]').click();
  await expect(first.locator('.similar-panel')).toContainText('Looking for similar pieces');
  await expect(first.locator('[data-action="similar"]')).toBeDisabled();
  await expect(first.locator('.similar-panel')).toContainText('Product search took too long');
  await expect(first.locator('.similar-query')).toHaveText('Search: indigo straight leg jeans');
  await expect(first.locator('[data-action="similar"]')).toHaveText('Retry similar search');
  await first.locator('[data-action="similar"]').click();
  await expect(first.locator('.similar-panel')).toContainText('No close matches');
  await expect(first.locator('.similar-panel')).toContainText('Search details checked against the generated garment image.');
  await expect(first.locator('.similar-panel')).not.toContainText('No similar pieces were found.');
  expect(calls).toBe(2);
});
test('season and gender are selectable, submitted and reset; 3D routes are absent',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 const buffer=await sharp('public/catalogue/blue-shirt.svg').png().toBuffer();
 await page.goto('/');
 await page.locator('#image-input').setInputFiles({name:'shirt.png',mimeType:'image/png',buffer});
 await page.locator('#identify-button').click();
 await expect(page.locator('#details-panel')).toBeVisible();
 await page.getByLabel('Seasonal colour palette').selectOption('summer-soft');
 await page.getByLabel('Gender',{exact:true}).selectOption('woman');
 await expect(page.locator('.season-chip')).toHaveCount(10);
 await page.locator('#details-panel').screenshot({path:'test-results/seasonal-form-mobile.png'});
 await page.setViewportSize({width:1440,height:1100});
 await page.locator('#details-panel').screenshot({path:'test-results/seasonal-form-desktop.png'});
 await page.setViewportSize({width:390,height:844});
 const request=page.waitForRequest(r=>r.url().endsWith('/api/recommend-outfits'));
 await page.locator('#recommend-button').click();
 expect((await request).postDataJSON()).toMatchObject({season:'summer-soft',gender:'woman'});
 await expect(page.locator('.outfit-card')).toHaveCount(3);
 await expect(page.locator('.look-direction').first()).toContainText('Summer / Soft');
 await page.locator('#results').screenshot({path:'test-results/seasonal-results-mobile.png'});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect((await page.request.post('/api/generate-outfit-model',{data:{}})).status()).toBe(404);
 expect((await page.request.get('/vendor/model-viewer.min.js')).status()).toBe(404);
 await page.locator('#another-button').click();
 await expect(page.locator('#gender-preference')).toHaveValue('unspecified');
 await expect(page.locator('#season-palette')).toHaveValue('auto');
 await expect(page.locator('.season-chip')).toHaveCount(0);
 expect(errors).toEqual([]);
});
