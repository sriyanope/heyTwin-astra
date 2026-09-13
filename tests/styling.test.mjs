import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { catalogue, stylingCatalogue } from '../lib/catalogue.mjs';
import { stylingPrompt, colourStory, colourSwatch, seasonalPalettes } from '../lib/styling.mjs';
import { garmentAttributes } from '../lib/pairings.mjs';

test('new style pieces have usable images and their exact design reaches generation', () => {
 assert.equal(new Set(catalogue.map(item=>item.id)).size,catalogue.length);
 for(const item of stylingCatalogue){
  assert.ok(fs.existsSync('public'+item.image_ref));
  const a=garmentAttributes(item);
  assert.equal(a.garment_type,item.design.garment_type);
  assert.equal(a.material,item.design.material);
  assert.equal(a.colour_hex,item.fill);
 }
 const striped=stylingCatalogue.find(item=>item.id==='navy-stripe-shirt');
 assert.match(fs.readFileSync('public'+striped.image_ref,'utf8'),/<pattern/);
});
test('requested style and confirmed patterned garment constrain the stylist', () => {
 const original={category:'top',colour:'olive',pattern:'floral',description:'Olive floral blouse'};
 const prompt=stylingPrompt(original,{},catalogue.filter(item=>item.category==='bottom'),'work','copenhagen');
 assert.match(prompt,/Requested direction: copenhagen/);assert.match(prompt,/Playful but wearable/);
 assert.doesNotMatch(prompt,/stockholm: Understated/);assert.match(prompt,/never recolour/);
 assert.match(prompt,/patterned original/);assert.match(prompt,/Occasion: work/);
 assert.match(prompt,/user-supplied spring, summer, autumn and winter chart/);assert.doesNotMatch(prompt,/Sanzo|Wada|Dictionary/);
 assert.match(prompt,/espresso-trousers/);assert.doesNotMatch(prompt,/rose-shirt/);
});
test('swatches are labelled interpretations, preserve the original name and do not invent unknown colours',()=>{
 const item=stylingCatalogue.find(item=>item.id==='espresso-trousers');
 assert.equal(colourStory({colour:'light blue'},item)[0].label,'light blue');
 assert.equal(colourStory({colour:'light blue'},item)[1].hex,item.fill);
 assert.equal(colourSwatch('multicoloured floral'),null);assert.equal(colourSwatch('white and navy'),null);assert.equal(colourSwatch('__proto__'),null);
});
test('seasonal chart has all twelve palettes and gender remains an explicit clothing preference',()=>{
 assert.equal(Object.keys(seasonalPalettes).length,12);
 for(const palette of Object.values(seasonalPalettes)) { assert.equal(palette.colours.length,10); for(const hex of palette.colours) assert.match(hex,/^#[0-9A-F]{6}$/); }
 const prompt=stylingPrompt({category:'top',colour:'blue',pattern:'solid'}, {}, [], 'casual', 'stockholm', 'winter-cool', 'man');
 assert.match(prompt,/Selected palette: winter-cool/); assert.match(prompt,/User selected Man/);
 assert.match(prompt,/Do not infer gender from the photo/);assert.doesNotMatch(prompt, /"spring-light":/);
});
