# Verification — 13 September 2026

Local preview: **http://localhost:4173**. No public deployment workflow is configured in this repository.

## Live runtime verification

Runtime: `gpt-5.6-terra`, using the configured server-side API key and the documented Chat Completions endpoint. Real garment JPEGs were uploaded through Chromium at **390 × 844** with no mocked routes or provider responses.

| Case | Actual result |
| --- | --- |
| White T-shirt | Identified as a white solid short-sleeve crew-neck top. Confirmed edited description and casual occasion. Three visual pairings: indigo jeans, olive trousers, black A-line skirt. Final measured run: 15.0s identification, 19.9s total. Earlier successful runs took 8–9s total. |
| Blue jeans | Identified as medium-blue solid straight-leg denim bottoms. Confirmed edited description and casual occasion. Three visual pairings: white shirt, black knit top, rust T-shirt. 2.9s identification, 6.6s total. |
| Folded side-view museum trousers | Provider returned an unclear-image response; app requested a clearer photograph. No invented recommendation was displayed. A clear jeans image was used for the successful bottom case. |
| Invalid image bytes | HTTP 400 `INVALID_IMAGE`. |

The live browser checks asserted opposite top/bottom categories, two ownership-tagged items per outfit, edited descriptions retained, all six garment images decoding, original uploaded image sources unchanged, visible cards and no horizontal overflow. Screenshots were visually inspected. Explanations referred to the actual white top and blue denim respectively.

Live evidence, intentionally ignored by Git:

- `test-results/live-results.json`
- `test-results/live-top-mobile.png`
- `test-results/live-bottom-mobile.png`

Photos were downloaded only into `/tmp/heytwin-verification`, not included in the shipped catalogue:

- [T-shirt2.jpg](https://commons.wikimedia.org/wiki/File:T-shirt2.jpg), Elkagye, public domain.
- [Jeans.jpg](https://commons.wikimedia.org/wiki/File:Jeans.jpg), Oktaeder, public domain; uploaded by Juanmak.
- [Trousers, blue (AM 741191-2).jpg](https://commons.wikimedia.org/wiki/File:Trousers,_blue_(AM_741191-2).jpg), Auckland Museum, CC BY 4.0, used for the unclear-input check.

## Controlled checks

- `npm run build`: passed. Syntax checking and deterministic SVG catalogue build; the app serves native browser modules and has no bundled build step.
- `npm test` / `node --test tests/api.test.mjs`: **8 passed**. Top/bottom pipeline, mandatory confirmation, colour/pattern/category corrections in the provider request, invalid/oversized input, unavailable provider, malformed output, invalid/same-category/duplicate catalogue IDs, session expiry/discard, adapter authentication and timeout handling.
- `npm run test:browser`: **5 passed**, using the installed Chromium 1208 via `PLAYWRIGHT_EXECUTABLE_PATH`. Phone-width top/bottom visual journey, corrections, retained photo on error and retry, separate sample mode, desktop layout, unclear analysis and reset during an in-flight request.
- `git diff --check`: passed. `.env` is ignored and the application contains no client-side API key.

Controlled tests use an injected provider and original catalogue illustrations as inputs; they are not presented as live quality evidence. The separate live checks above establish the actual runtime path.

## Remaining limits

- Camera capture is implemented with a separate `capture="environment"` file input but has not been exercised on a physical phone. No physical-device, Safari or mobile-data test was performed.
- No public deployment was performed; no hosting provider was added or changed.
- Eight representative SVG garments constrain available combinations. The illustrations are clearly labelled and do not imply retailer inventory or ownership.
- HEIC and animated formats are not supported. JPG, PNG and WebP are accepted up to 8 MB.
- These runs demonstrate functionality, not a broad evaluation of garment recognition or styling quality. Latency varies.
