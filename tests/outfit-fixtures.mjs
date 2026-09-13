import sharp from 'sharp';

const colours = { jeans: '#405976', trousers: '#79816a', skirt: '#383a3c', shirt: '#a8c3d0', 'knit top': '#383a3c', 't-shirt': '#b86b50' };
const extensionFor = { image: 'png', preview: 'png' };
const contentTypeFor = { image: 'image/png', preview: 'image/png' };

function typeFor(context) { return context?.attributes?.garment_type || 'trousers'; }
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

async function assets() {
  const result = new Map();
  for (const type of Object.keys(colours)) {
    result.set(filename(type, 'image'), { data: await imagePng(type, false), contentType: contentTypeFor.image });
    result.set(filename(type, 'preview'), { data: await imagePng(type, true), contentType: contentTypeFor.preview });
  }
  return result;
}

export function createFixtureGeneration() {
  const records = new Map(), timers = new Set(); let closed = false; const ready = assets();
  const stateFor = context => {
    const record = records.get(context.pairing_id) || {};
    return Object.fromEntries(['image', 'preview'].map(kind => [kind, record[kind] || {
      status: 'idle',
      source_state: 'sample'
    }]));
  };
  const settle = (context, kind) => {
    const key = context.pairing_id, type = typeFor(context), record = records.get(key);
    if (!record || closed) return;
    record[kind] = { status: 'processing', source_state: 'sample' };
    const timer = setTimeout(() => { timers.delete(timer); if (!closed && records.get(key) === record) record[kind] = { status: 'succeeded', source_state: 'sample', asset_url: assetUrl(type, kind) }; }, 200);
    timers.add(timer);
  };
  return {
    async state(context) { await ready; return stateFor(context); },
    async start(kind, context) {
      await ready;
      const record = records.get(context.pairing_id) || {}; records.set(context.pairing_id, record);
      if (!record[kind] || ['failed', 'idle'].includes(record[kind].status)) {
        record[kind] = { status: 'pending', source_state: 'sample' };
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
