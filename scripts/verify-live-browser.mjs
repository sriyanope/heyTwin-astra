// Explicit live UI verification; pass your own consented JPEG garment photos.
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const [top,bottom]=process.argv.slice(2);
if(!top||!bottom)throw new Error('Usage: node scripts/verify-live-browser.mjs top.jpg bottom.jpg');
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH});
const page=await browser.newPage({viewport:{width:390,height:844}});
const records=[];
mkdirSync('test-results',{recursive:true});
try {
  for(const [category,file] of [['top',top],['bottom',bottom]]){
    await page.goto(process.env.PREVIEW_URL||'http://127.0.0.1:4173');
    await page.locator('#image-input').setInputFiles(file);
    await page.locator('#identify-button').waitFor({state:'visible'});
    const start=Date.now();
    const identified=page.waitForResponse(response=>response.url().endsWith('/api/analyze-garment'),{timeout:60000});
    await page.locator('#identify-button').click();
    const analysisResponse=await identified;
    const analysis=await analysisResponse.json();
    assert.equal(analysisResponse.status(),200,JSON.stringify(analysis));
    assert.equal(analysis.attributes.category.value,category);
    await page.locator('#details-panel').waitFor({state:'visible'});
    const analysis_ms=Date.now()-start;
    const description=await page.locator('#description').inputValue();
    const corrected=description+' For a relaxed everyday look.';
    await page.locator('#description').fill(corrected);
    await page.locator('#occasion').selectOption('casual');
    const recommended=page.waitForResponse(response=>response.url().endsWith('/api/recommend-outfits'),{timeout:60000});
    await page.locator('#recommend-button').click();
    const recommendationResponse=await recommended;
    const result=await recommendationResponse.json();
    assert.equal(recommendationResponse.status(),200,JSON.stringify(result));
    await page.locator('#results').waitFor({state:'visible'});
    assert.ok(result.outfits.length>=1);
    for(const outfit of result.outfits){
      assert.equal(outfit.items.length,2);assert.equal(outfit.items[0].category,category);assert.notEqual(outfit.items[1].category,category);
      assert.equal(outfit.items[0].description,corrected);
      assert.equal(outfit.items[0].ownership,'user_item');assert.equal(outfit.items[1].ownership,'suggested_item');
    }
    await page.locator('.garment-image').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
    const original=await page.locator('#preview').getAttribute('src');
    for(const image of await page.locator('.piece:first-child img').all())assert.equal(await image.getAttribute('src'),original);
    assert.equal(await page.locator('.outfit-card').count(),result.outfits.length);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await page.screenshot({path:`test-results/live-${category}-mobile.png`,fullPage:true});
    records.push({category,analysis_ms,total_ms:Date.now()-start,analysis,result});
    writeFileSync('test-results/live-results.json',JSON.stringify(records,null,2));
    console.log(JSON.stringify({category,description,outfits:result.outfits.length,analysis_ms,total_ms:Date.now()-start}));
    await page.locator('#another-button').click();
  }
  const invalid=await page.request.post((process.env.PREVIEW_URL||'http://127.0.0.1:4173')+'/api/analyze-garment',{data:{image:'data:image/png;base64,AAAA'}});
  assert.equal(invalid.status(),400);
  console.log('PASS: live top and bottom upload → identification → correction → visual cards at phone width.');
}finally{await browser.close();}
