import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import sharp from 'sharp';
import { importProduct, importCollection } from '../scripts/catalogue/import-merchant.mjs';

// Proves the generic merchant importer against a local fixture server, since no real
// blogshop URL with confirmed reuse permission is available in this repository yet.
// Every response below is a fixture authored for this test, not scraped from anywhere.
async function startFixtureServer(t) {
  const productImage = await sharp({ create: { width: 600, height: 800, channels: 3, background: { r: 90, g: 110, b: 140 } } }).jpeg().toBuffer();
  const routes = {
    '/product/sample-top': { type: 'html', body: `<!doctype html><html><head><title>Sample Top</title>
      <script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'Product', name: 'Sample Blue Top', image: '/images/sample-top.jpg' })}</script>
      </head><body>Sample product page fixture (not a real merchant).</body></html>` },
    '/images/sample-top.jpg': { type: 'jpeg', body: productImage },
    '/blog/post': { type: 'html', body: `<!doctype html><html><head><meta property="og:type" content="article"><meta property="og:image" content="/images/sample-top.jpg"></head><body>Not a product page.</body></html>` },
    '/collection/tops': { type: 'html', body: `<!doctype html><html><body><a href="/product/sample-top">Sample Blue Top</a></body></html>` },
    '/private/secret-product': { type: 'html', body: `<!doctype html><html><body>Should be skipped by robots.txt.</body></html>` },
    '/robots.txt': { type: 'text', body: 'User-agent: *\nDisallow: /private/\n' },
  };
  const server = http.createServer((request, response) => {
    const route = routes[request.url];
    if (!route) { response.writeHead(404); return response.end('not found'); }
    const contentType = { html: 'text/html', jpeg: 'image/jpeg', text: 'text/plain' }[route.type];
    response.writeHead(200, { 'content-type': contentType });
    response.end(route.body);
  }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  return `http://127.0.0.1:${server.address().port}`;
}

test('merchant importer skips entries with no recorded permission basis', async t => {
  const base = await startFixtureServer(t);
  const items = [];
  const result = await importProduct(`${base}/product/sample-top`, { target_category: 'top', permission_basis: '', reviewed: true }, { items });
  assert.equal(result.status, 'skipped');
  assert.equal(result.reason, 'missing-permission-basis');
  assert.equal(items.length, 0);
});

test('merchant importer extracts JSON-LD product image, validates it, and requires explicit review before going live', async t => {
  const base = await startFixtureServer(t);
  const items = [];
  const entry = { target_category: 'top', subcategory: 't-shirt', permission_basis: 'Fixture authored for this test; not a real merchant.', reviewed: false };
  const notYetReviewed = await importProduct(`${base}/product/sample-top`, entry, { items });
  assert.equal(notYetReviewed.status, 'skipped');
  assert.equal(notYetReviewed.reason, 'not-yet-reviewed');

  const result = await importProduct(`${base}/product/sample-top`, { ...entry, reviewed: true, colour_primary: 'blue' }, { items });
  assert.equal(result.status, 'accepted');
  assert.equal(items.length, 1);
  assert.equal(items[0].name, 'Sample Blue Top');
  assert.equal(items[0].category, 'top');
  assert.equal(items[0].review_status, 'approved');
  assert.equal(items[0].active, true);
  assert.match(items[0].image_ref, /^\/catalogue\/real\/top-t-shirt-.+\.jpg$/);

  const duplicate = await importProduct(`${base}/product/sample-top`, { ...entry, reviewed: true }, { items });
  assert.equal(duplicate.status, 'duplicate');
});

test('merchant importer only trusts Open Graph images once og:type confirms a product page', async t => {
  const base = await startFixtureServer(t);
  const items = [];
  const result = await importProduct(`${base}/blog/post`, { target_category: 'top', permission_basis: 'Fixture test', reviewed: true }, { items });
  assert.equal(result.status, 'failed');
  assert.equal(result.reason, 'no-product-image-found');
});

test('merchant importer expands a collection page into product links', async t => {
  const base = await startFixtureServer(t);
  const items = [];
  const results = await importCollection({ url: `${base}/collection/tops`, target_category: 'top', permission_basis: 'Fixture test', reviewed: true }, { items });
  assert.equal(results.length, 1);
  assert.equal(results[0].status, 'accepted');
  assert.equal(items[0].source_page, `${base}/product/sample-top`);
});

test('merchant importer skips paths disallowed by robots.txt without attempting a bypass', async t => {
  const base = await startFixtureServer(t);
  const items = [];
  const result = await importProduct(`${base}/private/secret-product`, { target_category: 'top', permission_basis: 'Fixture test', reviewed: true }, { items });
  assert.equal(result.status, 'skipped');
  assert.equal(result.reason, 'robots-disallowed');
  assert.equal(items.length, 0);
});
