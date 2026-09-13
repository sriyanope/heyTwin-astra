// Fixed-proportion neutral mannequin. Model output supplies garment data, never executable code.
function colour(value) {
  if (typeof value !== 'string' || !/^#[0-9a-f]{6}$/i.test(value)) throw new Error('invalid colour');
  return [1, 3, 5].map(index => {
    const srgb = Number.parseInt(value.slice(index, index + 2), 16) / 255;
    // glTF material factors use linear colour; CSS/provider hex colours use sRGB.
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  }).concat(1);
}

export function validateOutfitSpec(value) {
  const top = value?.top, bottom = value?.bottom;
  if (!top || !bottom
    || !['shirt', 't-shirt', 'blouse', 'knit'].includes(top.type)
    || !['jeans', 'trousers', 'skirt'].includes(bottom.type)
    || !['short', 'long', 'sleeveless'].includes(top.sleeves)
    || !['regular', 'relaxed', 'peplum'].includes(top.silhouette)
    || !['straight', 'tapered', 'wide', 'a-line'].includes(bottom.silhouette)
    || !['full', 'ankle', 'midi'].includes(bottom.length)) throw new Error('invalid outfit schema');
  return { top: { ...top, colour: colour(top.colour) }, bottom: { ...bottom, colour: colour(bottom.colour) } };
}

// Stable product colour swatches avoid ambiguous CSS colour names (notably indigo denim).
export function resolveOutfitSpec(spec, context = {}) {
  validateOutfitSpec(spec);
  const resolved = { top: { ...spec.top }, bottom: { ...spec.bottom } };
  const palette = { white: '#F4F2ED', ivory: '#EEE7D4', cream: '#E7DDC4', black: '#24262B', navy: '#263852', blue: '#7194AF', olive: '#747653', rust: '#A75435' };
  for (const attributes of [context.original_attributes, context.attributes]) {
    if (!attributes || !['top', 'bottom'].includes(attributes.category)) continue;
    const garment = resolved[attributes.category];
    const name = String(attributes.colour || '').toLowerCase().trim();
    const swatch = name === 'indigo' && garment.type === 'jeans' ? '#293F63' : palette[name];
    if (swatch) garment.colour = swatch;
  }
  return resolved;
}

// Rings run from bottom to top, with an elliptical horizontal section at each height.
function loft(parts, name, material, rings, segments = 32) {
  const positions = [], indices = [];
  for (const [x, y, z, rx, rz] of rings) {
    for (let i = 0; i < segments; i++) {
      const angle = i / segments * Math.PI * 2;
      positions.push(x + Math.cos(angle) * rx, y, z + Math.sin(angle) * rz);
    }
  }
  for (let row = 0; row < rings.length - 1; row++) {
    for (let i = 0; i < segments; i++) {
      const next = (i + 1) % segments, a = row * segments + i, b = row * segments + next;
      indices.push(a, b + segments, b, a, a + segments, b + segments);
    }
  }
  // Duplicate cap rims to preserve sharp garment hems in the computed normals.
  for (const end of [0, rings.length - 1]) {
    const ring = rings[end], center = positions.length / 3;
    positions.push(...ring.slice(0, 3));
    const rim = positions.length / 3;
    positions.push(...positions.slice(end * segments * 3, (end + 1) * segments * 3));
    for (let i = 0; i < segments; i++) {
      const a = rim + i, b = rim + (i + 1) % segments;
      indices.push(...(end ? [center, b, a] : [center, a, b]));
    }
  }
  const normals = Array(positions.length).fill(0);
  for (let i = 0; i < indices.length; i += 3) {
    const [a, b, c] = indices.slice(i, i + 3).map(index => index * 3);
    const ab = [0, 1, 2].map(j => positions[b + j] - positions[a + j]);
    const ac = [0, 1, 2].map(j => positions[c + j] - positions[a + j]);
    const cross = [ab[1] * ac[2] - ab[2] * ac[1], ab[2] * ac[0] - ab[0] * ac[2], ab[0] * ac[1] - ab[1] * ac[0]];
    for (const index of [a, b, c]) for (let j = 0; j < 3; j++) normals[index + j] += cross[j];
  }
  for (let i = 0; i < normals.length; i += 3) {
    const magnitude = Math.hypot(...normals.slice(i, i + 3)) || 1;
    for (let j = 0; j < 3; j++) normals[i + j] /= magnitude;
  }
  parts.push({ name, material, positions, normals, indices });
}

function ellipsoid(parts, name, material, x, y, z, rx, ry, rz) {
  const rings = [];
  for (let i = 0; i <= 20; i++) {
    const angle = -Math.PI / 2 + i / 20 * Math.PI;
    // Tiny polar rings avoid degenerate surface triangles.
    const radius = Math.max(0.0001, Math.cos(angle));
    rings.push([x, y + Math.sin(angle) * ry, z, rx * radius, rz * radius]);
  }
  loft(parts, name, material, rings);
}

function encodeGlb(parts, colours) {
  const chunks = [], bufferViews = [], accessors = [], meshes = [], nodes = [];
  let offset = 0;
  function addBuffer(array, target) {
    const padding = (4 - offset % 4) % 4;
    if (padding) { chunks.push(Buffer.alloc(padding)); offset += padding; }
    const data = Buffer.from(array.buffer, array.byteOffset, array.byteLength);
    const index = bufferViews.length;
    bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: data.length, target });
    chunks.push(data); offset += data.length;
    return index;
  }
  for (const part of parts) {
    const positions = new Float32Array(part.positions), normals = new Float32Array(part.normals), indices = new Uint16Array(part.indices);
    const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < positions.length; i += 3) for (let j = 0; j < 3; j++) {
      min[j] = Math.min(min[j], positions[i + j]); max[j] = Math.max(max[j], positions[i + j]);
    }
    const position = accessors.length;
    accessors.push({ bufferView: addBuffer(positions, 34962), componentType: 5126, count: positions.length / 3, type: 'VEC3', min, max });
    const normal = accessors.length;
    accessors.push({ bufferView: addBuffer(normals, 34962), componentType: 5126, count: normals.length / 3, type: 'VEC3' });
    const index = accessors.length;
    accessors.push({ bufferView: addBuffer(indices, 34963), componentType: 5123, count: indices.length, type: 'SCALAR' });
    nodes.push({ name: part.name, mesh: meshes.length });
    meshes.push({ name: part.name, primitives: [{ attributes: { POSITION: position, NORMAL: normal }, indices: index, material: part.material }] });
  }
  const binary = Buffer.concat(chunks);
  const document = Buffer.from(JSON.stringify({
    asset: { version: '2.0', generator: 'heyTwin openai-parametric-v2' },
    scene: 0, scenes: [{ nodes: nodes.map((_, index) => index) }], nodes, meshes,
    materials: colours.map((baseColorFactor, index) => ({ name: ['Neutral mannequin', 'Bottom garment', 'Top garment'][index], pbrMetallicRoughness: { baseColorFactor, metallicFactor: 0, roughnessFactor: 0.85 } })),
    buffers: [{ byteLength: binary.length }], bufferViews, accessors,
  }));
  const jsonChunk = Buffer.concat([document, Buffer.alloc((4 - document.length % 4) % 4, 32)]);
  const binaryChunk = Buffer.concat([binary, Buffer.alloc((4 - binary.length % 4) % 4)]);
  const header = Buffer.alloc(12), jsonHeader = Buffer.alloc(8), binaryHeader = Buffer.alloc(8);
  header.write('glTF'); header.writeUInt32LE(2, 4); header.writeUInt32LE(28 + jsonChunk.length + binaryChunk.length, 8);
  jsonHeader.writeUInt32LE(jsonChunk.length); jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  binaryHeader.writeUInt32LE(binaryChunk.length); binaryHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jsonHeader, jsonChunk, binaryHeader, binaryChunk]);
}

export function buildOutfitGlb(spec) {
  const outfit = validateOutfitSpec(spec), parts = [];
  const skin = 0, bottom = 1, top = 2;
  ellipsoid(parts, 'Head', skin, 0, 2.86, 0, 0.235, 0.30, 0.215);
  loft(parts, 'Neck', skin, [[0, 2.38, 0, 0.13, 0.12], [0, 2.65, 0, 0.12, 0.11]]);
  loft(parts, 'Torso', skin, [[0, 1.48, 0, 0.32, 0.20], [0, 2.28, 0, 0.40, 0.20], [0, 2.40, 0, 0.27, 0.18]]);
  for (const side of [-1, 1]) {
    const name = side < 0 ? 'Right' : 'Left';
    loft(parts, `${name} arm`, skin, [[side * 0.78, 1.42, 0, 0.09, 0.10], [side * 0.65, 1.83, 0, 0.11, 0.12], [side * 0.46, 2.32, 0, 0.15, 0.14]]);
    ellipsoid(parts, `${name} hand`, skin, side * 0.805, 1.30, 0, 0.105, 0.17, 0.075);
    loft(parts, `${name} leg`, skin, [[side * 0.23, 0.12, 0, 0.12, 0.13], [side * 0.23, 0.73, 0, 0.16, 0.16], [side * 0.22, 1.51, 0, 0.20, 0.19]]);
    ellipsoid(parts, `${name} foot`, skin, side * 0.23, 0.095, 0.10, 0.15, 0.095, 0.27);
    if (outfit.top.sleeves !== 'sleeveless') {
      const long = outfit.top.sleeves === 'long';
      loft(parts, `${name} sleeve`, top, [[side * (long ? 0.77 : 0.58), long ? 1.47 : 1.99, 0, long ? 0.13 : 0.18, 0.17], [side * 0.46, 2.36, 0, 0.20, 0.21]]);
    }
  }
  const relaxed = outfit.top.silhouette === 'relaxed';
  loft(parts, 'Top garment', top, [[0, 1.47, 0, outfit.top.silhouette === 'peplum' ? 0.51 : relaxed ? 0.46 : 0.39, 0.26], [0, 1.79, 0, relaxed ? 0.45 : 0.35, 0.235], [0, 2.27, 0, 0.47, 0.25], [0, 2.42, 0, 0.29, 0.19]]);
  if (outfit.top.type === 'shirt' || outfit.top.type === 'knit') {
    loft(parts, 'Collar', top, [[0, 2.40, 0, 0.16, 0.145], [0, outfit.top.type === 'knit' ? 2.50 : 2.46, 0, 0.15, 0.135]]);
  }
  if (outfit.bottom.type === 'skirt') {
    const hem = outfit.bottom.length === 'midi' ? 0.60 : outfit.bottom.length === 'ankle' ? 0.28 : 0.16;
    loft(parts, 'Skirt', bottom, [[0, hem, 0, outfit.bottom.silhouette === 'a-line' ? 0.67 : 0.48, 0.34], [0, 1.55, 0, 0.39, 0.245]]);
  } else {
    const hem = outfit.bottom.length === 'ankle' ? 0.29 : 0.14;
    const radius = outfit.bottom.silhouette === 'wide' ? 0.29 : outfit.bottom.silhouette === 'tapered' ? 0.16 : 0.215;
    for (const side of [-1, 1]) {
      loft(parts, `${side < 0 ? 'Right' : 'Left'} trouser leg`, bottom, [[side * 0.23, hem, 0, radius, 0.205], [side * 0.23, 0.82, 0, Math.max(radius, 0.215), 0.22], [side * 0.22, 1.55, 0, 0.24, 0.245]]);
    }
    loft(parts, 'Waistband', bottom, [[0, 1.39, 0, 0.425, 0.24], [0, 1.56, 0, 0.39, 0.245]]);
  }
  return encodeGlb(parts, [[0.69, 0.65, 0.58, 1], outfit.bottom.colour, outfit.top.colour]);
}
