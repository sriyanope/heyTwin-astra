import { createApp } from '../server.mjs';
import { createFixtureGeneration, createFixtureProductSearch } from './outfit-fixtures.mjs';
let failNext = true;
const generation = createFixtureGeneration();
const productSearch = createFixtureProductSearch();
createApp({ env: {}, generation, productSearch, provider: async (prompt, image) => {
  await new Promise(resolve=>setTimeout(resolve,100));
  if(image) return {usable:true,attributes:{category:{value:'top',confidence:.9},colour:{value:'blue',confidence:.9},pattern:{value:'solid',confidence:.9}},description:'Blue relaxed collared shirt',confidence:.9,uncertainty:{level:'medium',note:'Check the colour in this lighting.'}};
  if(prompt.includes('retry-test') && failNext) { failNext=false; throw Object.assign(new Error('The styling service is busy. Please try again.'),{status:502,code:'MODEL_API_ERROR'}); }
  const bottom = prompt.includes('"category":"bottom","colour"');
  return {outfits:(bottom?['white-shirt','black-knit','rust-tee']:['indigo-jeans','olive-trousers','black-skirt']).map((id,index)=>({catalogue_item_id:id,name:`Pairing ${index+1}`,explanation:'The soft neutral balances the colour and shape of your piece.',confidence:.9}))};
} }).listen(4175,'127.0.0.1',()=>console.log('Controlled browser-test provider only; not live AI.'));
