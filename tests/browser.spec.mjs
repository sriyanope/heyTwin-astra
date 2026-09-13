import { test, expect } from '@playwright/test';
async function upload(page) {
  // Original local garment illustration rasterized for a controlled upload test.
  await page.goto('/catalogue/blue-shirt.svg');
  const buffer=await page.screenshot();
  await page.goto('/');
  await page.locator('#image-input').setInputFiles({name:'test-shirt.png',mimeType:'image/png',buffer});
  await expect(page.locator('#preview')).toBeVisible();
  await page.getByRole('button',{name:'Identify my piece'}).click();
  await expect(page.locator('#details-panel')).toBeVisible();
}
for(const category of ['top','bottom']) test(`${category} full visual flow at phone width with corrections`,async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await upload(page);
  await page.locator('#category').selectOption(category);
  await page.locator('#colour').fill('burgundy');
  await page.locator('#description').fill(`Burgundy patterned ${category}`);
  const confirmed=page.waitForRequest(request=>request.url().endsWith('/api/confirm-garment'));
  const response=page.waitForResponse(response=>response.url().endsWith('/api/recommend-outfits'));
  await page.getByRole('button',{name:'Find my pairings'}).click();
  expect((await confirmed).postDataJSON().corrected_attributes.colour).toBe('burgundy');
  const data=await(await response).json();
  for(const outfit of data.outfits)expect(outfit.items[1].category).toBe(category==='top'?'bottom':'top');
  await expect(page.locator('.outfit-card')).toHaveCount(3);
  await expect(page.getByText('Your item',{exact:true})).toHaveCount(4);
  await expect(page.getByText('Suggested pairing',{exact:true})).toHaveCount(3);
  const original=await page.locator('#preview').getAttribute('src');
  for(const image of await page.locator('.piece:first-child img').all())expect(await image.getAttribute('src')).toBe(original);
  await expect(page.locator('.piece:nth-child(2) img')).toHaveCount(3, { timeout: 12000 });
  await expect.poll(() => page.locator('.garment-image').evaluateAll(images=>images.every(image=>image.complete&&image.naturalWidth>0))).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(errors).toEqual([]);
  await page.screenshot({path:`test-results/${category}-mobile.png`,fullPage:true});
  await page.getByRole('button',{name:'Style another piece'}).click();
  await expect(page.locator('#preview-wrap')).toBeHidden();
  await expect(page.getByRole('button',{name:'Style this piece'})).toBeFocused();
});
test('invalid input and provider failure retain the photo and allow retry',async({page})=>{
  await upload(page);
  const original=await page.locator('#preview').getAttribute('src');
  await page.locator('#image-input').setInputFiles({name:'broken.png',mimeType:'image/png',buffer:Buffer.from('not an image')});
  await expect(page.getByRole('status')).toContainText('could not be read');
  expect(await page.locator('#preview').getAttribute('src')).toBe(original);
  await page.locator('#description').fill('retry-test blue shirt');
  await page.getByRole('button',{name:'Find my pairings'}).click();
  await expect(page.getByRole('status')).toContainText('busy');
  await expect(page.locator('#results')).toBeHidden();
  expect(await page.locator('#preview').getAttribute('src')).toBe(original);
  await page.getByRole('button',{name:'Find my pairings'}).click();
  await expect(page.locator('.outfit-card')).toHaveCount(3);
});
test('sample is explicitly separate; desktop layout and keyboard action',async({page})=>{
  await page.setViewportSize({width:1280,height:900});
  await page.goto('/');
  await page.getByRole('button',{name:'View a sample pairing'}).click();
  await expect(page.locator('#source-badge')).toHaveText('Sample · not live AI');
  await expect(page.getByText('Example item',{exact:true})).toBeVisible();
  await expect(page.getByText('Your item',{exact:true})).toBeHidden();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'test-results/sample-desktop.png',fullPage:true});
});
test('unclear analysis and reset during loading do not render stale results',async({page})=>{
  await page.route('**/api/analyze-garment',route=>route.fulfill({status:422,contentType:'application/json',body:JSON.stringify({error:{code:'IMAGE_UNCLEAR',message:'Try a clearer photo of one top or bottom.'}})}));
  await page.goto('/catalogue/blue-shirt.svg');const buffer=await page.screenshot();await page.goto('/');
  await page.locator('#image-input').setInputFiles({name:'shirt.png',mimeType:'image/png',buffer});
  await page.locator('#identify-button').click();
  await expect(page.getByRole('status')).toContainText('clearer');
  await expect(page.locator('#details-panel')).toBeHidden();
  await expect(page.locator('#preview')).toBeVisible();
  await page.unroute('**/api/analyze-garment');
  await page.locator('#identify-button').click();
  await page.getByRole('button',{name:'Remove',exact:true}).click();
  await page.waitForTimeout(300);
  await expect(page.locator('#details-panel')).toBeHidden();
  await expect(page.locator('#preview-wrap')).toBeHidden();
});
test('brand fonts, logo and responsive layout load at 320, 390 and 1280 pixels',async({page})=>{
  for(const width of [320,390,1280]){
    await page.setViewportSize({width,height:900});
    await upload(page);
    await page.evaluate(()=>document.fonts.ready);
    expect(await page.evaluate(()=>document.fonts.check('400 32px Franxurter')&&document.fonts.check('400 16px Poppins')&&document.fonts.check('700 16px Poppins'))).toBe(true);
    expect(await page.locator('.brand-logo').evaluate(image=>image.complete&&image.naturalWidth===1920)).toBe(true);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:`test-results/brand-confirm-${width}.png`,fullPage:true});
    await page.locator('#recommend-button').focus();
    await expect(page.locator('#recommend-button')).toBeFocused();
    expect(await page.locator('#recommend-button').evaluate(button=>getComputedStyle(button).outlineStyle)).not.toBe('none');
  }
});
