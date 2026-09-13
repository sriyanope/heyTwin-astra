import { createHash } from 'node:crypto';

export const digest = value => createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');

// Design attributes for our suggestions, not claims about the user's photo.
const designs = {
  'indigo-jeans': ['jeans', 'denim', 'straight-leg', 'full length', 'five pockets, plain waistband'],
  'olive-trousers': ['trousers', 'cotton twill', 'tapered', 'ankle length', 'tailored waistband, side pockets'],
  'black-skirt': ['skirt', 'woven cotton', 'A-line', 'midi', 'plain waistband, softly flared hem'],
  'cream-trousers': ['trousers', 'woven cotton', 'wide-leg', 'full length', 'relaxed drape, plain waistband'],
  'white-shirt': ['shirt', 'cotton poplin', 'relaxed', 'hip length', 'collar, button front, long sleeves'],
  'blue-shirt': ['shirt', 'cotton poplin', 'relaxed', 'hip length', 'collar, button front, long sleeves'],
  'black-knit': ['knit top', 'cotton knit', 'regular', 'hip length', 'crew neckline, short sleeves'],
  'rust-tee': ['t-shirt', 'cotton jersey', 'relaxed', 'hip length', 'crew neckline, short sleeves'],
};

export function garmentAttributes(item) {
  const [garment_type, material, silhouette, length, details] = designs[item.id] || [
    /jeans/i.test(item.description) ? 'jeans' : /skirt/i.test(item.description) ? 'skirt' : item.category === 'bottom' ? 'trousers' : /t-shirt/i.test(item.description) ? 't-shirt' : 'shirt',
    'unspecified', 'unspecified', 'unspecified', item.description,
  ];
  const design = item.design || { garment_type, material, silhouette, length, details };
  return { ...design, ...(item.colour_hex ? { colour_hex: item.colour_hex } : {}), category: item.category, garment_type: design.garment_type, colour: item.colour, pattern: item.pattern, material: design.material, silhouette: design.silhouette, length: design.length, details: design.details };
}

export function pairingContext(session, item) {
  const attributes = { ...garmentAttributes(item), styling_gender: session.gender || 'unspecified' };
  return {
    pairing_id: digest({ version: 1, photo: session.image_hash, original: session.confirmed, item: item.id, attributes }),
    attributes,
    original_attributes: { ...session.confirmed },
    image_hash: session.image_hash,
  };
}

// Only the configured public origin and a generated asset reference are combined.
// Never accept a client-supplied image URL or expose the original upload to search.
export function publicImageURL(origin, assetURL) {
  if (!origin || !/^\/generated\/[a-zA-Z0-9_-]+\.(png|jpe?g|webp)$/.test(assetURL || '')) return undefined;
  try {
    const url = new URL(origin);
    if (url.protocol !== 'https:' || url.username || url.password || url.port || url.pathname !== '/' || url.search || url.hash ||
        !url.hostname.includes('.') || /(^localhost$|\.localhost$|\.local$|\.internal$|^[\d.]+$|:)/i.test(url.hostname)) return undefined;
    return new URL(assetURL, url.origin).href;
  } catch { return undefined; }
}
