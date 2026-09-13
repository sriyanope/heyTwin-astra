import sharp from 'sharp';

const colours = { jeans: '#405976', trousers: '#79816a', skirt: '#383a3c', shirt: '#a8c3d0', 'knit top': '#383a3c', 't-shirt': '#b86b50' };
const extensionFor = { image: 'png', preview: 'png', model: 'glb' };
const contentTypeFor = { image: 'image/png', preview: 'image/png', model: 'model/gltf-binary' };

function typeFor(context) { return context?.attributes?.garment_type || 'trousers'; }
function usesParametricModel(context) { return context?.original_attributes?.description === 'Parametric 3D browser fixture'; }
function filename(type, kind) { return `fixture-${type.replaceAll(' ', '-')}-${kind}.${extensionFor[kind]}`; }
function assetUrl(type, kind) { return `/generated/${filename(type, kind)}`; }

function garmentPath(type, colour) {
  if (type === 'skirt') return `<path d="M150 180h100l35 150H115z" fill="${colour}"/>`;
  if (['jeans', 'trousers'].includes(type)) return `<path d="M150 170h100l12 165h-48l-14-112-14 112h-48z" fill="${colour}"/><path d="M200 170v165" stroke="#182840" stroke-width="4"/>`;
  return `<path d="M135 150l32-28h66l32 28-20 42-15-12v145h-60V180l-15 12z" fill="${colour}"/>`;
}

async function imagePng(type, preview) {
  const colour = colours[type] || colours.trousers;
  const mannequin = preview ? `<circle cx="200" cy="72" r="31" fill="#d6c6af"/><path d="M170 105h60l28 105h-116z" fill="#c8b9a4"/><path d="M171 125l-40 110M229 125l40 110" stroke="#c8b9a4" stroke-width="23" stroke-linecap="round"/><path d="M180 210l-15 145M220 210l15 145" stroke="#c8b9a4" stroke-width="27" stroke-linecap="round"/>` : '';
  const transform = preview ? 'translate(0 68) scale(1 .82)' : 'translate(0 25)';
  const svg = `<svg width="400" height="420" viewBox="0 0 400 420" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="420" fill="#f7f0df"/><ellipse cx="200" cy="382" rx="112" ry="18" fill="#d8c9af" opacity=".55"/>${mannequin}<g transform="${transform}">${garmentPath(type, colour)}</g><path d="M0 0h400v420H0z" fill="none" stroke="#152b4a" stroke-width="9"/></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

function pushCylinder(parts, material, cx, cy, cz, radiusTop, radiusBottom, height, segments = 12) {
  const positions = [], normals = [], indices = [];
  for (let row = 0; row < 2; row++) for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const radius = row ? radiusTop : radiusBottom;
    positions.push(cx + Math.cos(angle) * radius, cy + (row ? height / 2 : -height / 2), cz + Math.sin(angle) * radius);
    normals.push(Math.cos(angle), 0, Math.sin(angle));
  }
  // CCW exterior faces (the original fixture used the inward-facing order).
  for (let i = 0; i < segments; i++) { const next = (i + 1) % segments; indices.push(i, segments + next, next, i, segments + i, segments + next); }
  const bottomCenter = positions.length / 3;
  positions.push(cx, cy - height / 2, cz); normals.push(0, -1, 0);
  const topCenter = positions.length / 3;
  positions.push(cx, cy + height / 2, cz); normals.push(0, 1, 0);
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    indices.push(bottomCenter, i, next, topCenter, segments + next, segments + i);
  }
  parts.push({ material, positions, normals, indices });
}

function pushSphere(parts, material, cx, cy, cz, radius, rings = 8, segments = 12) {
  const positions = [], normals = [], indices = [];
  for (let row = 0; row <= rings; row++) for (let i = 0; i <= segments; i++) {
    const phi = (row / rings) * Math.PI, theta = (i / segments) * Math.PI * 2;
    const x = Math.sin(phi) * Math.cos(theta), y = Math.cos(phi), z = Math.sin(phi) * Math.sin(theta);
    positions.push(cx + x * radius, cy + y * radius, cz + z * radius); normals.push(x, y, z);
  }
  for (let row = 0; row < rings; row++) for (let i = 0; i < segments; i++) {
    const a = row * (segments + 1) + i, b = a + segments + 1; indices.push(a, b, a + 1, b, b + 1, a + 1);
  }
  parts.push({ material, positions, normals, indices });
}

function buildGlb(type) {
  const parts = [], skin = 0, garment = 1, top = 2;
  // A complete neutral mannequin: head, torso, arms, legs, feet, plus a distinct clothing volume.
  pushSphere(parts, skin, 0, 2.65, 0, .28); pushCylinder(parts, skin, 0, 1.85, 0, .38, .46, 1.22);
  pushCylinder(parts, skin, -.58, 1.9, 0, .13, .13, 1.18); pushCylinder(parts, skin, .58, 1.9, 0, .13, .13, 1.18);
  pushCylinder(parts, skin, -.22, .64, 0, .18, .22, 1.28); pushCylinder(parts, skin, .22, .64, 0, .18, .22, 1.28);
  pushCylinder(parts, skin, -.22, -.05, .12, .19, .19, .28); pushCylinder(parts, skin, .22, -.05, .12, .19, .19, .28);
  // The fixture's blue shirt makes the neutral top visually distinct from skin.
  pushCylinder(parts, top, 0, 1.95, 0, .49, .54, 1.08);
  pushCylinder(parts, top, -.58, 2.19, 0, .16, .16, .58); pushCylinder(parts, top, .58, 2.19, 0, .16, .16, .58);
  pushSphere(parts, skin, -.58, 1.24, 0, .15); pushSphere(parts, skin, .58, 1.24, 0, .15);
  if (type === 'skirt') pushCylinder(parts, garment, 0, 1.05, 0, .42, .72, 1.35);
  else if (type === 'jeans') { pushCylinder(parts, garment, -.22, .64, 0, .25, .29, 1.38); pushCylinder(parts, garment, .22, .64, 0, .25, .29, 1.38); }
  else { pushCylinder(parts, garment, -.22, .76, 0, .21, .27, 1.15); pushCylinder(parts, garment, .22, .76, 0, .21, .27, 1.15); }
  const chunks = [], views = [], accessors = [], primitives = [];
  let offset = 0;
  const add = (array, target) => {
    const data = Buffer.from(array.buffer, array.byteOffset, array.byteLength); const aligned = (4 - (offset % 4)) % 4;
    if (aligned) { chunks.push(Buffer.alloc(aligned)); offset += aligned; }
    const view = views.length; chunks.push(data); views.push({ buffer: 0, byteOffset: offset, byteLength: data.length, target }); offset += data.length; return view;
  };
  for (const part of parts) {
    const position = new Float32Array(part.positions), normal = new Float32Array(part.normals), index = new Uint16Array(part.indices);
    const positionView = add(position, 34962), normalView = add(normal, 34962), indexView = add(index, 34963);
    const minimum = [Infinity, Infinity, Infinity], maximum = [-Infinity, -Infinity, -Infinity];
    for (let index = 0; index < position.length; index += 3) for (let axis = 0; axis < 3; axis++) { minimum[axis] = Math.min(minimum[axis], position[index + axis]); maximum[axis] = Math.max(maximum[axis], position[index + axis]); }
    const posAccessor = accessors.length; accessors.push({ bufferView: positionView, componentType: 5126, count: position.length / 3, type: 'VEC3', min: minimum, max: maximum });
    const normalAccessor = accessors.length; accessors.push({ bufferView: normalView, componentType: 5126, count: normal.length / 3, type: 'VEC3' });
    const indexAccessor = accessors.length; accessors.push({ bufferView: indexView, componentType: 5123, count: index.length, type: 'SCALAR' });
    primitives.push({ attributes: { POSITION: posAccessor, NORMAL: normalAccessor }, indices: indexAccessor, material: part.material });
  }
  const bin = Buffer.concat(chunks);
  const json = Buffer.from(JSON.stringify({ asset: { version: '2.0', generator: 'heyTwin browser test fixture' }, scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0 }], meshes: [{ primitives }], materials: [{ pbrMetallicRoughness: { baseColorFactor: [.76, .68, .57, 1], metallicFactor: 0, roughnessFactor: .8 } }, { pbrMetallicRoughness: { baseColorFactor: hexColour(colours[type] || colours.trousers), metallicFactor: 0, roughnessFactor: .72 } }, { pbrMetallicRoughness: { baseColorFactor: hexColour(colours.shirt), metallicFactor: 0, roughnessFactor: .65 } }], buffers: [{ byteLength: bin.length }], bufferViews: views, accessors }));
  const paddedJson = Buffer.concat([json, Buffer.alloc((4 - json.length % 4) % 4, 0x20)]), paddedBin = Buffer.concat([bin, Buffer.alloc((4 - bin.length % 4) % 4)]);
  const header = Buffer.alloc(12); header.write('glTF'); header.writeUInt32LE(2, 4); header.writeUInt32LE(12 + 8 + paddedJson.length + 8 + paddedBin.length, 8);
  const jsonHeader = Buffer.alloc(8); jsonHeader.writeUInt32LE(paddedJson.length, 0); jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const binHeader = Buffer.alloc(8); binHeader.writeUInt32LE(paddedBin.length, 0); binHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jsonHeader, paddedJson, binHeader, paddedBin]);
}

function hexColour(hex) { return [1, 3, 5].map(index => Number.parseInt(hex.slice(index, index + 2), 16) / 255).concat(1); }

async function assets() {
  const result = new Map();
  for (const type of Object.keys(colours)) {
    result.set(filename(type, 'image'), { data: await imagePng(type, false), contentType: contentTypeFor.image });
    result.set(filename(type, 'preview'), { data: await imagePng(type, true), contentType: contentTypeFor.preview });
    result.set(filename(type, 'model'), { data: buildGlb(type), contentType: contentTypeFor.model });
  }
  return result;
}

export function createFixtureGeneration() {
  const records = new Map(), timers = new Set(); let closed = false; const ready = assets();
  const stateFor = context => {
    const record = records.get(context.pairing_id) || {};
    return Object.fromEntries(['image', 'preview', 'model'].map(kind => [kind, record[kind] || {
      status: 'idle',
      source_state: 'sample',
      ...(kind === 'model' && usesParametricModel(context) ? { method: 'openai-parametric' } : {}),
    }]));
  };
  const settle = (context, kind) => {
    const key = context.pairing_id, type = typeFor(context), record = records.get(key);
    if (!record || closed) return;
    record[kind] = { status: 'processing', source_state: 'sample', ...(kind === 'model' && usesParametricModel(context) ? { method: 'openai-parametric' } : {}) };
    const timer = setTimeout(() => { timers.delete(timer); if (!closed && records.get(key) === record) record[kind] = { status: 'succeeded', source_state: 'sample', asset_url: assetUrl(type, kind), ...(kind === 'model' && usesParametricModel(context) ? { method: 'openai-parametric' } : {}) }; }, 200);
    timers.add(timer);
  };
  return {
    async state(context) { await ready; return stateFor(context); },
    async start(kind, context) {
      await ready;
      const record = records.get(context.pairing_id) || {}; records.set(context.pairing_id, record);
      if (!record[kind] || ['failed', 'idle'].includes(record[kind].status)) {
        record[kind] = { status: 'pending', source_state: 'sample', ...(kind === 'model' && usesParametricModel(context) ? { method: 'openai-parametric' } : {}) };
        const timer = setTimeout(() => { timers.delete(timer); settle(context, kind); }, 50); timers.add(timer);
      }
      return stateFor(context);
    },
    async asset(name) { return (await ready).get(name) || null; },
    async close() { closed = true; for (const timer of timers) clearTimeout(timer); timers.clear(); },
  };
}

export function createFixtureProductSearch() {
  return {
    async search({ attributes = {} } = {}) {
      const type = typeFor({ attributes }).replaceAll(' ', '-');
      return { status: 'succeeded', method: 'text', source_state: 'sample', products: [
        { title: `Fixture ${attributes.colour || ''} ${attributes.garment_type || 'garment'}`.trim(), retailer: 'Test fixture retailer', url: `https://example.com/products/${type}-one`, price: '89', currency: 'USD', match_notes: ['colour', 'silhouette'] },
        { title: `Fixture alternative ${attributes.garment_type || 'garment'}`, retailer: 'Test fixture retailer', url: `https://example.com/products/${type}-two`, match_notes: ['material'] },
      ] };
    },
  };
}
