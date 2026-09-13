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

test('all three pairings generate isolated images, show honest product fixtures, preview and rotate their own GLB', async ({ page }) => {
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
    await expect(page.locator('#model-controls button')).toHaveText('Explore in 3D');
    await page.locator('#model-controls button').click();
    const viewer = page.locator('model-viewer');
    await expect(viewer).toBeVisible({ timeout: 12000 });
    await expect.poll(() => viewer.evaluate(element => Boolean(element.loaded)), { timeout: 15000 }).toBe(true);
    sources.push(await viewer.getAttribute('src'));
    expect(sources[index]).toBe(`/generated/fixture-${['jeans', 'trousers', 'skirt'][index]}-model.glb`);
    if (index === 0) {
      await page.locator('#outfit-dialog').screenshot({ path: 'test-results/outfit-preview-desktop.png' });
      await viewer.scrollIntoViewIfNeeded();
      const before = await viewer.evaluate(element => element.getCameraOrbit().theta);
      await viewer.screenshot({ path: 'test-results/model-front.png' });
      const box = await viewer.boundingBox();
      await page.mouse.move(box.x + box.width * .65, box.y + box.height * .55);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * .2, box.y + box.height * .55, { steps: 15 });
      await page.mouse.up();
      await expect.poll(() => viewer.evaluate(element => element.getCameraOrbit().theta)).not.toBe(before);
      await viewer.screenshot({ path: 'test-results/model-dragged.png' });
      await viewer.evaluate(element => { element.cameraOrbit = '180deg 75deg 105%'; element.jumpCameraToGoal(); });
      await viewer.screenshot({ path: 'test-results/model-back.png' });
      await page.getByRole('button', { name: 'Reset view' }).click();
      await expect.poll(() => viewer.evaluate(element => Math.abs(element.getCameraOrbit().theta)), { timeout: 4000 }).toBeLessThan(.02);
    }
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

test('OpenAI-parametric mode explores a simplified 3D model without first generating a 2D preview', async ({ page }) => {
  test.setTimeout(45000);
  await uploadPairings(page, 'Parametric 3D browser fixture');
  await card(page, 0).locator('[data-action="preview"]').click();

  await expect(page.locator('.model-note')).toContainText('simplified 3D sketch');
  await expect(page.locator('.model-note')).toContainText('does not predict fit');
  await expect(page.locator('.outfit-preview-image')).toHaveCount(0);

  const explore = page.locator('#model-controls button', { hasText: 'Explore in 3D' });
  await expect(explore).toBeEnabled();
  await explore.click();

  const viewer = page.locator('model-viewer');
  await expect(viewer).toBeVisible({ timeout: 12000 });
  await expect.poll(() => viewer.getAttribute('src'), { timeout: 12000 }).toMatch(/\/generated\/fixture-jeans-model\.glb$/);
  await expect.poll(() => viewer.evaluate(element => Boolean(element.loaded)), { timeout: 15000 }).toBe(true);
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
