import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOutfitGlb, validateOutfitSpec } from '../lib/outfit-mesh.mjs';

const outfit = (bottom = 'trousers', silhouette = 'straight') => ({ top:{type:'blouse',colour:'#f0dfc0',sleeves:'long',silhouette:'peplum'},bottom:{type:bottom,colour:'#405976',silhouette,length:bottom === 'skirt' ? 'midi' : 'full'} });
function documentFor(glb) { assert.equal(glb.toString('ascii',0,4),'glTF'); assert.equal(glb.readUInt32LE(4),2); assert.equal(glb.readUInt32LE(8),glb.length); const n=glb.readUInt32LE(12); return JSON.parse(glb.subarray(20,20+n).toString().trim()); }
function decoded(glb) { const doc=documentFor(glb), jsonLength=glb.readUInt32LE(12), binStart=28+jsonLength; const bin=glb.subarray(binStart,binStart+glb.readUInt32LE(20+jsonLength)); const part=name=>{const mesh=doc.meshes.find(x=>x.name===name), primitive=mesh.primitives[0], accessor=doc.accessors[primitive.attributes.POSITION], view=doc.bufferViews[accessor.bufferView], values=[];for(let i=0;i<accessor.count;i++)values.push([0,1,2].map(j=>bin.readFloatLE((view.byteOffset||0)+(accessor.byteOffset||0)+i*12+j*4)));return values;};return {doc,part}; }

test('strictly validates the whitelisted outfit schema', () => {
  assert.deepEqual(validateOutfitSpec(outfit()).bottom.colour.map(x=>Math.round((x <= 0.0031308 ? x * 12.92 : 1.055 * x ** (1 / 2.4) - 0.055) * 255)),[64,89,118,255]);
  for (const bad of [{}, {...outfit(),top:{...outfit().top,colour:'blue'}}, {...outfit(),bottom:{...outfit().bottom,type:'jacket'}}, {...outfit(),bottom:{...outfit().bottom,silhouette:'code'}}]) assert.throws(() => validateOutfitSpec(bad));
});
test('builds bounded, finite indexed geometry with rounded named mannequin parts and materials', () => {
  const trousers=buildOutfitGlb(outfit('trousers','tapered')), skirt=buildOutfitGlb(outfit('skirt','a-line'));
  assert.notDeepEqual(trousers,skirt); const {doc,part}=decoded(skirt); assert.ok(Math.abs(doc.materials[1].pbrMetallicRoughness.baseColorFactor[0] - 0.051269458) < 0.000001); assert.ok(doc.meshes.some(x=>x.name==='Head')); assert.ok(part('Head').length>500); assert.ok(Math.min(...doc.accessors.filter(x=>x.min).map(x=>x.min[1]))>=0); for(const mesh of doc.meshes){const p=mesh.primitives[0],ix=doc.accessors[p.indices],pos=doc.accessors[p.attributes.POSITION],nv=doc.accessors[p.attributes.NORMAL];assert.ok(ix.count%3===0&&ix.count>0&&ix.count<=pos.count*12);assert.ok(pos.min.concat(pos.max).every(Number.isFinite));assert.equal(nv.count,pos.count);}
});
test('A-line skirts flare at the hem and tapered legs narrow at the foot', () => {
  const skirt=decoded(buildOutfitGlb(outfit('skirt','a-line'))).part('Skirt'); const span=(points,y)=>Math.max(...points.filter(p=>Math.abs(p[1]-y)<.01).map(p=>Math.abs(p[0]))); assert.ok(span(skirt,.6)>span(skirt,1.55));
  const leg=decoded(buildOutfitGlb(outfit('trousers','tapered'))).part('Right trouser leg'); assert.ok(span(leg,.14)<span(leg,1.55));
});

test('known garment colours override ambiguous names while custom colours remain model supplied', async () => {
  const { resolveOutfitSpec } = await import('../lib/outfit-mesh.mjs');
  const original = outfit('jeans'); original.bottom.colour = '#4B0082';
  const resolved = resolveOutfitSpec(original, { attributes: { category: 'bottom', colour: 'indigo' }, original_attributes: { category: 'top', colour: 'white' } });
  assert.equal(resolved.bottom.colour, '#293F63');
  assert.equal(resolved.top.colour, '#F4F2ED');
  assert.equal(original.bottom.colour, '#4B0082');
  assert.equal(resolveOutfitSpec(original, { attributes: { category: 'bottom', colour: 'muted lilac' } }).bottom.colour, '#4B0082');
});

test('every GLB index references a finite vertex and all surface normals are unit length', () => {
  const glb = buildOutfitGlb(outfit());
  const doc = documentFor(glb), binaryOffset = 28 + glb.readUInt32LE(12);
  for (const mesh of doc.meshes) {
    const primitive = mesh.primitives[0], position = doc.accessors[primitive.attributes.POSITION];
    const index = doc.accessors[primitive.indices], indexView = doc.bufferViews[index.bufferView];
    for (let i = 0; i < index.count; i++) assert.ok(glb.readUInt16LE(binaryOffset + indexView.byteOffset + i * 2) < position.count, mesh.name);
    const normal = doc.accessors[primitive.attributes.NORMAL], view = doc.bufferViews[normal.bufferView];
    for (let i = 0; i < normal.count; i++) {
      const xyz = [0, 1, 2].map(j => glb.readFloatLE(binaryOffset + view.byteOffset + i * 12 + j * 4));
      assert.ok(xyz.every(Number.isFinite), mesh.name);
      assert.ok(Math.abs(Math.hypot(...xyz) - 1) < 0.001, mesh.name);
    }
  }
});
