// Wikimedia Commons page parsing. Plain HTML page fetches only (via lib.cachedGetText),
// never /w/api.php or /api/ — both paths are Disallow'd for generic crawlers in Commons'
// robots.txt. /wiki/File: and /wiki/Category: pages carry no such Disallow rule.
import { ALLOWED_LICENSES } from './lib.mjs';

function stripTags(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#0*39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
}

export function commonsCategoryUrl(category) {
  const name = category.replace(/^Category:/, '');
  return `https://commons.wikimedia.org/wiki/Category:${encodeURIComponent(name).replace(/%2F/g, '/')}`;
}

export function commonsFileUrl(title) {
  const name = title.replace(/^File:/, '');
  return `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(name).replace(/%2F/g, '/')}`;
}

// Extracts /wiki/File:... links from a rendered Category page. Excludes navigation/
// sister links by requiring the File: link sit inside the gallery markup Commons uses.
export function extractFileLinksFromCategoryHtml(html) {
  const titles = new Set();
  const galleryMatch = html.match(/<div class="mw-category-generated">[\s\S]*?(?:<div id="mw-subcategories"|<div id="footer")/) || [html];
  const scope = galleryMatch[0];
  for (const match of scope.matchAll(/href="\/wiki\/(File:[^"#]+)"/g)) {
    try { titles.add(decodeURIComponent(match[1]).replace(/_/g, ' ')); } catch { /* skip malformed escape */ }
  }
  return [...titles];
}

// Deterministic transform from a Commons thumbnail URL to the full-resolution original,
// e.g. .../commons/thumb/a/ab/File.jpg/220px-File.jpg -> .../commons/a/ab/File.jpg
function originalFromThumb(thumbUrl) {
  const match = thumbUrl.match(/^(.*\/commons)\/thumb\/(.+)\/[0-9]+px-[^/]+$/);
  return match ? `${match[1]}/${match[2]}` : null;
}

// Commons decorates the "Original file" link with tracking query params (?utm_source=...)
// using literal, un-decoded "&amp;" inside the HTML attribute; strip the query entirely —
// we only need the stable path, not the tracking params.
function cleanUploadUrl(url) {
  return url.replace(/&amp;.*$/, '').replace(/\?.*$/, '');
}

export function extractFullResImageUrl(html) {
  const explicit = html.match(/class="internal"[^>]*href="(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/[^"]+)"/) || html.match(/href="(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/[^"]+)"[^>]*>\s*Original file/);
  if (explicit) return cleanUploadUrl(explicit[1]);
  const thumb = html.match(/src="(\/\/upload\.wikimedia\.org\/wikipedia\/commons\/thumb\/[^"]+)"/);
  if (thumb) { const derived = originalFromThumb(cleanUploadUrl(`https:${thumb[1]}`)); if (derived) return derived; }
  return null;
}

export function extractAuthor(html) {
  const row = html.match(/id="fileinfotpl_aut"[^>]*>[\s\S]*?<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/);
  return row ? stripTags(row[1]).slice(0, 200) : '';
}

export function extractTitle(html) {
  const heading = html.match(/<h1[^>]*id="firstHeading"[^>]*>([\s\S]*?)<\/h1>/);
  return heading ? stripTags(heading[1]).replace(/^File:/, '') : '';
}

// Returns { token, label, url } for the first recognized reuse-permitting license,
// or null if no allowed license is found (NC/ND/unclear -> null, and the caller must skip).
export function extractLicense(html) {
  const licensingSection = html.match(/id="licensing"[\s\S]{0,6000}/)?.[0] || html;
  const ccMatch = licensingSection.match(/creativecommons\.org\/licenses\/([a-z-]+)\/([0-9.]+)/i);
  if (ccMatch) {
    const variant = ccMatch[1].toLowerCase();
    const version = ccMatch[2];
    if (/nc|nd/.test(variant)) return null; // non-commercial or no-derivatives: not usable here
    const token = `cc-${variant}-${version}`;
    if (ALLOWED_LICENSES[token]) return { token, label: ALLOWED_LICENSES[token], url: `https://creativecommons.org/licenses/${variant}/${version}` };
    return null;
  }
  if (/creativecommons\.org\/publicdomain\/zero\/1\.0/i.test(licensingSection)) {
    return { token: 'cc0-1.0', label: ALLOWED_LICENSES['cc0-1.0'], url: 'https://creativecommons.org/publicdomain/zero/1.0/' };
  }
  if (/This (?:file|work) is (?:in|considered to be in) the public domain/i.test(licensingSection) || /\bPD-self\b|\bPD-old\b|\bPD-US\b/.test(licensingSection)) {
    return { token: 'pd', label: ALLOWED_LICENSES.pd, url: 'https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia#Material_in_the_public_domain' };
  }
  return null;
}
