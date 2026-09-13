// Generic merchant (blogshop) product/collection page extraction.
// Structured data first (JSON-LD Product), then product-specific HTML; Open Graph images
// are used only once og:type confirms the page is actually a product page.
function stripTags(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function extractJsonLdProducts(html) {
  const products = [];
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    let parsed;
    try { parsed = JSON.parse(match[1].trim()); } catch { continue; }
    const nodes = Array.isArray(parsed) ? parsed : parsed['@graph'] ? parsed['@graph'] : [parsed];
    for (const node of nodes) {
      const types = Array.isArray(node?.['@type']) ? node['@type'] : [node?.['@type']];
      if (types.includes('Product')) products.push(node);
    }
  }
  return products;
}

export function firstImageUrl(imageField) {
  if (!imageField) return null;
  const value = Array.isArray(imageField) ? imageField[0] : imageField;
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && typeof value.url === 'string') return value.url;
  return null;
}

export function extractOpenGraphProduct(html) {
  const type = html.match(/<meta[^>]+property=["']og:type["'][^>]+content=["']([^"']+)["']/i)?.[1]
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:type["']/i)?.[1];
  if (!type || !/product/i.test(type)) return null; // cannot confirm this OG image is a product photo
  const image = html.match(/<meta[^>]+property=["']og:image:secure_url["'][^>]+content=["']([^"']+)["']/i)?.[1]
    || html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1];
  const title = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1];
  return image ? { name: title || '', image } : null;
}

// Returns { name, imageUrl, source: 'json-ld' | 'open-graph' } or null if nothing usable was found.
export function extractProduct(html) {
  const jsonLd = extractJsonLdProducts(html)[0];
  const jsonLdImage = jsonLd && firstImageUrl(jsonLd.image);
  if (jsonLd && jsonLdImage) return { name: jsonLd.name || '', imageUrl: jsonLdImage, source: 'json-ld' };
  const og = extractOpenGraphProduct(html);
  if (og?.image) return { name: og.name, imageUrl: og.image, source: 'open-graph' };
  return null;
}

// Extracts candidate product-page links from a collection/listing page: JSON-LD ItemList
// entries first, then anchors that look like product URLs (a conservative heuristic).
export function extractProductLinks(html, pageUrl) {
  const links = new Set();
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(match[1].trim());
      const nodes = Array.isArray(parsed) ? parsed : parsed['@graph'] ? parsed['@graph'] : [parsed];
      for (const node of nodes) {
        if (node?.['@type'] === 'ItemList' && Array.isArray(node.itemListElement)) {
          for (const element of node.itemListElement) {
            const url = element?.url || element?.item?.url || element?.item?.['@id'];
            if (url) links.add(new URL(url, pageUrl).toString());
          }
        }
      }
    } catch { /* not JSON-LD we can use */ }
  }
  if (!links.size) {
    for (const match of html.matchAll(/<a[^>]+href=["']([^"'#?]*(?:\/products?\/|\/item\/)[^"'?#]*)["']/gi)) {
      try { links.add(new URL(match[1], pageUrl).toString()); } catch { /* skip malformed href */ }
    }
  }
  return [...links];
}

export { stripTags };
