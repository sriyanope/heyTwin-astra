import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp, createProvider } from '../server.mjs';

export const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a2ioAAAAASUVORK5CYII=';
const analysis = (category = 'top') => ({ usable: true, attributes: Object.fromEntries(Object.entries({ category, colour: 'blue', pattern: 'solid' }).map(([key,value]) => [key,{value,confidence:.9}])), description: `Blue solid ${category}`, confidence:.9, uncertainty:{level:'high',note:''} });
const outfit = id => ({ catalogue_item_id:id,name:'Everyday contrast',explanation:'Cream gives the blue garment a soft contrast.',confidence:.9 });
async function start(t, options) {
  const app = createApp(options).listen(0,'127.0.0.1');
  await once(app,'listening');
  t.after(() => new Promise(resolve => app.close(resolve)));
  const url = `http://127.0.0.1:${app.address().port}`;
  return async (route, payload) => {
    const response = await fetch(url + route,{method:'POST',headers:{'content-type':'application/json'},body:typeof payload === 'string' ? payload : JSON.stringify(payload)});
    return {status:response.status,body:await response.json()};
  };
}
for(const category of ['top','bottom']) test(`${category}: analysis, mandatory correction, valid complementary visual`,async t=>{
  const calls=[];
  const post=await start(t,{provider:async(prompt,image)=>{calls.push({prompt,image});return image ? analysis(category) : {outfits:[outfit(category==='top'?'cream-trousers':'white-shirt')]};}});
  const first=await post('/api/analyze-garment',{image:png});
  assert.equal(first.status,200);
  const garment_id=first.body.garment_id;
  assert.equal((await post('/api/recommend-outfits',{garment_id})).status,409);
  const corrected_attributes={category,colour:'burgundy',pattern:'striped',description:`Burgundy striped ${category}`};
  assert.equal((await post('/api/confirm-garment',{garment_id,corrected_attributes})).status,200);
  const result=await post('/api/recommend-outfits',{garment_id,confirmed_attributes:corrected_attributes,occasion:'work'});
  assert.equal(result.status,200);
  const [own,suggestion]=result.body.outfits[0].items;
  assert.equal(own.colour,'burgundy'); assert.equal(own.ownership,'user_item'); assert.equal(own.image_ref,'user_upload');
  assert.equal(suggestion.ownership,'suggested_item'); assert.notEqual(suggestion.category,category); assert.match(suggestion.image_ref,/^\/catalogue\/.+\.svg$/);
  assert.equal(calls[0].image,png); assert.match(calls[1].prompt,/burgundy/); assert.match(calls[1].prompt,/striped/); assert.match(calls[1].prompt,/work/);
});
test('category correction changes the permitted catalogue',async t=>{
  let prompt;
  const post=await start(t,{provider:async(p,image)=>image?analysis('top'):(prompt=p,{outfits:[outfit('black-knit')]})});
  const {body:{garment_id}}=await post('/api/analyze-garment',{image:png});
  await post('/api/confirm-garment',{garment_id,corrected_attributes:{category:'bottom',colour:'black',pattern:'plaid',description:'Black plaid skirt'}});
  const result=await post('/api/recommend-outfits',{garment_id});
  assert.equal(result.status,200); assert.equal(result.body.outfits[0].items[1].category,'top');
  assert.match(prompt,/white-shirt/); assert.doesNotMatch(prompt,/cream-trousers/);
});
test('invalid JSON, fake images, unsupported files, oversized images never call provider',async t=>{
  let calls=0;const post=await start(t,{provider:async()=>{calls++;}});
  assert.equal((await post('/api/analyze-garment','{')).status,400);
  for (const image of ['data:image/svg+xml;base64,AAAA','data:image/png;base64,AAAA','hello',null]) assert.equal((await post('/api/analyze-garment',{image})).status,400);
  assert.equal((await post('/api/analyze-garment',{image:'data:image/png;base64,'+Buffer.alloc(8*1024*1024+1).toString('base64')})).status,413);
  assert.equal(calls,0);
});
test('unclear photo rejected; missing provider returns no fallback',async t=>{
  const post=await start(t,{provider:async()=>({...analysis(),usable:false})});
  assert.equal((await post('/api/analyze-garment',{image:png})).status,422);
  const offline=await start(t,{env:{}});
  const result=await offline('/api/analyze-garment',{image:png});
  assert.equal(result.status,503); assert.equal(result.body.error.code,'PROVIDER_NOT_CONFIGURED'); assert.equal(result.body.outfits,undefined);
});
test('malformed output, invalid catalogue IDs, same-category and duplicate selections are rejected',async t=>{
  let output=analysis();const post=await start(t,{provider:async()=>output});
  const {body:{garment_id}}=await post('/api/analyze-garment',{image:png});
  await post('/api/confirm-garment',{garment_id,corrected_attributes:{category:'top',colour:'blue',pattern:'solid',description:'Blue top'}});
  for(const bad of [{outfits:[outfit('fake-url')]},{outfits:[outfit('white-shirt')]},{outfits:[outfit('cream-trousers'),outfit('cream-trousers')]},{outfits:[]},{outfits:[{...outfit('cream-trousers'),confidence:3}]}]) {
    output=bad;assert.equal((await post('/api/recommend-outfits',{garment_id})).status,502);
  }
  output={usable:true,confidence:.9};assert.equal((await post('/api/analyze-garment',{image:png})).status,502);
});
test('expiry and discard remove session attributes',async t=>{
  let now=0;const post=await start(t,{now:()=>now,provider:async()=>analysis()});
  const {body:{garment_id}}=await post('/api/analyze-garment',{image:png});now=16*60*1000;
  assert.equal((await post('/api/confirm-garment',{garment_id})).status,410);
  const next=await post('/api/analyze-garment',{image:png});
  assert.equal((await post('/api/discard-garment',{garment_id:next.body.garment_id})).status,200);
  assert.equal((await post('/api/recommend-outfits',{garment_id:next.body.garment_id})).status,410);
});
test('provider adapter sends model and image, hides credentials on errors and handles timeout',async()=>{
  const env={VISION_MODEL_BASE_URL:'https://api.openai.com/v1',VISION_MODEL_API_KEY:'test-secret',VISION_MODEL:'gpt-5.6-terra'};
  const provider=createProvider(env,async(url,options)=>{
    assert.equal(String(url),'https://api.openai.com/v1/chat/completions');
    assert.equal(options.headers.authorization,'Bearer test-secret');
    const body=JSON.parse(options.body);assert.equal(body.model,env.VISION_MODEL);assert.equal(body.messages[1].content[1].image_url.url,png);
    return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(analysis())}}]})};
  });assert.equal((await provider('JSON',png)).usable,true);
  for(const [fetcher,code] of [[async()=>({ok:false,status:401}),'MODEL_API_ERROR'],[async()=>{throw new DOMException('test-secret','TimeoutError');},'MODEL_TIMEOUT'],[async()=>({ok:true,json:async()=>({choices:[{message:{content:'invalid'}}]})}),'INVALID_MODEL_OUTPUT']]) {
    await assert.rejects(createProvider(env,fetcher)('JSON',png),error=>error.code===code&&!error.message.includes('test-secret'));
  }
});
test('temporary connection failure retries once, using the same deadline and keeping diagnostics private',async()=>{
  const events=[];let calls=0;let signal;
  const env={VISION_MODEL_BASE_URL:'https://api.openai.com/v1',VISION_MODEL_API_KEY:'private-test-key',VISION_MODEL:'gpt-5.6-terra'};
  const provider=createProvider(env,async(url,options)=>{
    calls++;
    if(calls===1){signal=options.signal;throw new TypeError('contains private-test-key and photo',{cause:Object.assign(new Error('private contents'),{code:'ECONNRESET'})});}
    assert.equal(options.signal,signal);
    return {ok:true,json:async()=>({choices:[{message:{content:'{"ok":true}'}}]})};
  },event=>events.push(event));
  assert.deepEqual(await provider('JSON'),{ok:true});
  assert.equal(calls,2);assert.equal(events[0].retry,true);
  assert.doesNotMatch(JSON.stringify(events),/private-test-key|photo|private contents/);
});
test('persistent connection failure has bounded retries; malformed HTTP JSON is not labelled a connection error',async()=>{
  const env={VISION_MODEL_BASE_URL:'https://api.openai.com/v1',VISION_MODEL_API_KEY:'test-secret',VISION_MODEL:'gpt-5.6-terra'};
  let calls=0;
  await assert.rejects(createProvider(env,async()=>{calls++;throw new TypeError('fetch failed',{cause:{code:'ECONNRESET'}});},()=>{})('JSON'),error=>error.code==='MODEL_CONNECTION_ERROR');
  assert.equal(calls,2);
  await assert.rejects(createProvider(env,async()=>({ok:true,json:async()=>{throw new SyntaxError('html instead of JSON');}}),()=>{})('JSON'),error=>error.code==='INVALID_MODEL_OUTPUT');
});
