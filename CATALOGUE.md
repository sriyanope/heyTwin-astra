# Catalogue pipeline

How heyTwin's "Suggested pairing" images are collected, reviewed and served. Product scope
lives in `instructions/PRODUCT_BRIEF.md`; this file only covers catalogue preparation.

## What's in the live catalogue

`data/catalogue.mjs` exports the single `catalogue` array the server recommends from. It is
the union of two sources, always available even if neither script below has ever run:

1. **8 original illustrations** (`public/catalogue/*.svg`), authored for this repo — unchanged.
2. **Reviewed real photos** from `data/catalogue-items.json`, filtered to `review_status:
   "approved"` and `active !== false`, and only if their image file actually exists on disk.

Nothing reaches the live recommendation flow without a human explicitly marking it reviewed
(see "Review gate" below) — a candidate having a valid open licence is necessary but not
sufficient.

## Sources

Configure sources in `data/sources.json`:

| Key | What it is | Goes live when |
|---|---|---|
| `wikimedia_commons_categories` | Category ("collection") pages to scan for candidates | Never directly — always lands in `needs_review` first |
| `wikimedia_commons_files` | Specific File: pages, with your own attributes filled in | `reviewed: true` is set |
| `merchant_products` | A single blogshop product URL | `permission_basis` is non-empty **and** `reviewed: true` |
| `merchant_collections` | A blogshop listing/collection URL (expanded into product links) | same as above, per expanded product |
| `local` | A path under `data/catalogue-inbox/` you already have rights to use | `permission_basis` is non-empty |

`permission_basis` is mandatory for merchant and local entries and is never inferred — a page
being public or scrapable is not treated as reuse being permitted. Wikimedia Commons entries
get their permission basis automatically, from the licence template on the file's own page
(only CC0, CC BY and CC BY-SA are accepted; CC BY-NC and CC BY-ND are rejected because the
preview step resizes/pads the image, which is a derivative work).

## Commands

```sh
npm run catalogue:discover       # scan configured Commons categories, cache review thumbnails
npm run catalogue:build          # promote reviewed entries into the live catalogue + rebuild
                                  # the contact sheet and the import report
npm run catalogue:contact-sheet  # just rebuild public/catalogue/contact-sheet.html
npm run catalogue:report         # just rebuild data/catalogue-report.{json,md}
```

All four are resumable and cache-first: rerunning never re-downloads a page or image it
already has on disk (`data/catalogue-cache/`, gitignored), and never duplicates a catalogue
item it already imported (checked by source URL and by image content hash).

## The review gate, end to end

1. `npm run catalogue:discover` reads `wikimedia_commons_categories`, lists candidate
   `File:` pages, checks each one's licence, and — for anything under an accepted licence —
   downloads the full-resolution image and saves a small local review copy under
   `data/catalogue-cache/commons/review/`. Nothing here is added to the live catalogue.
2. Open `data/catalogue-cache/commons/review.html` (rebuilt by `catalogue:contact-sheet`) to
   look at what was found.
3. For anything worth using, copy its title into `data/sources.json` ->
   `wikimedia_commons_files`, e.g.:

   ```json
   {
     "title": "File:Aran cardigan.jpg",
     "target_category": "top",
     "subcategory": "knitwear",
     "name": "Cream Aran Cardigan",
     "colour_primary": "cream",
     "pattern": "solid",
     "image_type": "flat_lay",
     "reviewed": true
   }
   ```

   Only fields you set are used — never invent fabric, brand, price or measurements; leave a
   field blank if you're not sure.
4. `npm run catalogue:build` fetches the file's licence one more time (in case it changed),
   downloads the full-resolution original (reusing the cached copy from step 1), validates
   it decodes and isn't a tiny thumbnail, pads it onto a consistent square canvas, writes
   `public/catalogue/real/<id>.jpg` + a thumbnail, and appends a full record to
   `data/catalogue-items.json`.

Blogshop (`merchant_*`) entries skip the discover step — point one directly at a product or
collection URL you have `permission_basis` for and set `reviewed: true`; the importer prefers
JSON-LD `Product` structured data and only falls back to an Open Graph image once `og:type`
confirms the page is actually a product page. It resolves relative image URLs, respects
`robots.txt` (skipping disallowed paths rather than working around them), rate-limits and
retries conservatively, and is proven against a local fixture in
`tests/catalogue-merchant.test.mjs` — no real blogshop URL with confirmed reuse rights was
available while building this, so `merchant_products`/`merchant_collections` in
`data/sources.json` ship as inactive templates. Supply real URLs (with `permission_basis`
filled in) and rerun `catalogue:build` to bring them in.

Local entries need no network at all: drop a file you have the rights to use into
`data/catalogue-inbox/`, add an entry under `local` with its metadata and a
`permission_basis`, then run `catalogue:build`.

## Every stored item

See `data/catalogue-items.json` for the full record shape: id, name, category, subcategory,
colour_primary/secondary, pattern, style/occasion tags, fit, image_type
(`isolated`/`flat_lay`/`modelled`), image_local/thumbnail_local paths, source_page,
source_image_url, source_name, retrieved_at, permission_basis, license_url, attribution,
provenance (`extracted`/`ai_inferred`/`manual_review`), review_status
(`needs_review`/`approved`/`rejected`), active, and image_hash (used for dedup).

## Compliance notes

- Only `/wiki/Category:` and `/wiki/File:` pages are fetched from `commons.wikimedia.org`.
  `/w/api.php` and `/api/` are `Disallow`'d for generic crawlers in that host's `robots.txt`,
  so the importer never calls them. Image bytes come from `upload.wikimedia.org`, whose
  `robots.txt` only disallows old archived revisions.
- Pinterest is not scraped anywhere in this pipeline (no sanctioned API access is configured);
  only original merchant URLs are accepted for blogshop items.
- No CAPTCHA or login bypass is implemented anywhere; a blocked or disallowed source is
  skipped, never worked around.
- A handful of Commons-hosted images were rejected during manual review despite carrying an
  accepted licence tag, because their filenames and framing (a cropped e-commerce product
  shot) suggested the upload's own licence claim was unreliable. Automated licence-tag
  parsing is necessary but not sufficient — human review before `reviewed: true` is the actual
  gate.

## Rebuilding the contact sheet / report only

If you've hand-edited `data/catalogue-items.json` (e.g. to flip an item's `active` flag),
rerun `npm run catalogue:contact-sheet` and `npm run catalogue:report` without re-importing
anything.
