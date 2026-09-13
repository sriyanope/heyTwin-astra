// Explicit opt-in live verification; uses configured server and consumes API credits.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
const [topPath,bottomPath]=process.argv.slice(2);
if(!topPath||!bottomPath)throw new Error('Usage: node scripts/verify-live.mjs top.jpg bottom.jpg');
const base=process.env.PREVIEW_URL||'http://127.0.0.1:4173';
async function post(route,body){
  const response=await fetch(`${base}/api/${route}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(60000)});
  const result=await response.json();
  if(!response.ok)throw new Error(`${route}: ${response.status} ${result.error?.code}: ${result.error?.message}`);
  return result;
}
const records=[];
for(const [category,file] of [['top',topPath],['bottom',bottomPath]]){
  const start=Date.now();
  const image='data:image/jpeg;base64,'+readFileSync(file).toString('base64');
  const analysis=await post('analyze-garment',{image});
  assert.equal(analysis.attributes.category.value,category);
  const identified=Date.now();
  const attributes={category,colour:analysis.attributes.colour.value,pattern:analysis.attributes.pattern.value,description:analysis.description};
  // A real user correction is sent through both confirmation and recommendation.
  attributes.description += '; for a relaxed everyday look';
  await post('confirm-garment',{garment_id:analysis.garment_id,corrected_attributes:attributes});
  const result=await post('recommend-outfits',{garment_id:analysis.garment_id,confirmed_attributes:attributes,occasion:'casual'});
  assert.ok(result.outfits.length>=1);
  for(const outfit of result.outfits){
    assert.equal(outfit.items.length,2);assert.equal(outfit.items[0].category,category);assert.notEqual(outfit.items[1].category,category);
    assert.equal(outfit.items[0].description,attributes.description);
    assert.equal(outfit.items[0].ownership,'user_item');assert.equal(outfit.items[1].ownership,'suggested_item');
    const visual=await fetch(base+outfit.items[1].image_ref);assert.equal(visual.status,200);assert.match(visual.headers.get('content-type'),/image/);
  }
  records.push({category,analysis_ms:identified-start,recommendation_ms:Date.now()-identified,analysis,result});
  console.log(JSON.stringify({category,identified:analysis.description,outfits:result.outfits.length,total_ms:Date.now()-start}));
  await post('discard-garment',{garment_id:analysis.garment_id});
}
const invalid=await fetch(base+'/api/analyze-garment',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({image:'data:image/png;base64,AAAA'})});
assert.equal(invalid.status,400);
mkdirSync('test-results',{recursive:true});
writeFileSync('test-results/live-results.json',JSON.stringify(records,null,2));
console.log('PASS: live top, bottom, corrections, visual assets, and invalid input.');
