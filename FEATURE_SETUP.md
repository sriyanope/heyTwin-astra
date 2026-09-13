# Outfit features

Run `npm ci`, then `npm run dev`, and open **http://localhost:4173**. Upload a top or bottom, confirm its description, and select **Find my pairings**. Suggested garment images generate automatically when the pairings appear, beside the unchanged original photo. Cached images appear immediately; failures offer **Retry image**. Each card also offers **Find similar** and **Preview outfit**. Inside the dialog, create a 2D neutral mannequin preview. The 3D feature has been removed.

Terra (`gpt-5.6-terra`) directs the Responses image-generation tool for garment images and 2D previews.

The original stays unchanged on the card. The mannequin is an approximate outfit visualization: it cannot establish physical fit, and unseen details may differ. There is no cloth simulation, measurement inference or checkout.

## Configuration

Add values to `.env` locally and restart the server. Keep the existing vision/styling configuration. Never put credentials in `public/`.

| Variable | Source and purpose |
| --- | --- |
| `IMAGE_API_KEY` | Optional separate OpenAI key for generated images. `OPENAI_API_KEY` also works. When vision uses the official `https://api.openai.com` origin, the adapter can reuse `VISION_MODEL_API_KEY`. |
| `GENERATION_MODEL` | Defaults to `gpt-5.6-terra`, independently of `VISION_MODEL`. Selects the Responses model directing image generation . |
| `IMAGE_MODEL` | Image tool renderer, default `gpt-image-1.5`. Keep a GPT Image model here; Terra belongs in `GENERATION_MODEL`. |
| `IMAGE_QUALITY` | Defaults to `medium`. Garment output is 1024×1024; mannequin output is 1024×1536. |
| `IMAGE_TIMEOUT_MS` | Request deadline; defaults to 180000 ms. No automatic paid retry. |
| `SERPAPI_API_KEY` | Obtain from [SerpApi API key management](https://serpapi.com/manage-api-key). Enables Google Lens and Google Shopping. |
| `PUBLIC_ASSET_ORIGIN` | Optional public HTTPS origin of this app, e.g. `https://your-deployment.example`. It must serve the app's `/generated/` URLs. Localhost cannot be used by Lens; without a public origin, text search works. This is not a credential. |
| `SERPAPI_TIMEOUT_MS` | Defaults to 60000; bounded to 10000–90000 ms. The browser allows time for visual search plus text fallback. |

Missing credentials produce setup states; normal use never silently receives fixture products or mannequin images. **Find similar** checks the isolated generated suggestion with the existing vision provider, then searches with confident visible attributes: garment type, colour, sleeve length, neckline, button front, silhouette and fabric construction. This works on localhost without `PUBLIC_ASSET_ORIGIN`: the server sends the saved generated image as a data URL to the vision provider and sends text keywords to SerpApi. The original upload is never sent for similar-product search. The first image check uses vision API credits; sanitized extracted attributes are cached in `data/search-profiles` by image bytes, model and prompt version. No additional key is required beyond the existing vision and SerpApi configuration.

If no generated image is ready or image checking fails, search uses the suggestion's description and design attributes. The card shows the query, whether image details were checked, and any fallback message. Public HTTPS hosting additionally enables Lens search. Filters distinguish shirts, T-shirts and knitwear and reject explicit sleeve, neckline and closure contradictions. Unspecified listing details remain unverified and are not claimed as matches. Authentication, request-limit, timeout, connection and provider-response failures have distinct safe error codes; raw provider errors and credential-bearing URLs are never logged. Products have source-provided links and prices only; delivery, availability, and exact matches are not promised.

Image requests use `store: false`, force a single image-tool result, and keep original references out of the local manifest. The cache includes both the Terra model and image-tool settings, so changing either creates a separate cache entry.

## Persistence and demo use

This prototype runs as one Node process with one writable `data/generated` directory. Its serialized, atomic manifest and opaque image files survive restarts. Retain this directory on a persistent volume for reliable demos. Reupload the same original and confirm the same attributes to reopen its own preview; generated garment images can be shared across equivalent suggestions. Successful outputs loaded after restart show a cached label. Interrupted requests require explicit retry.

This is a file-backed prototype, not a distributed job queue. Multiple processes must not write the same cache. Generated assets remain until the operator removes their records/files while the server is stopped. Their opaque URLs are accessible without a session so image providers and Lens can retrieve them; there is no directory listing or arbitrary URL-fetch proxy. Original uploads are never written to disk. Discarding a session removes its in-memory attributes and authorization, not already generated assets.

Browser fixtures have separate authored PNG assets, returned only by `tests/browser-server.mjs` with `source_state: sample`. They are a reliable local UI demo, explicitly labelled as samples, and do not establish live provider quality. They are never injected by `npm run dev`.

## Route contract

All feature routes are JSON POST requests requiring `{ garment_id, pairing_id }` from the current confirmed session. The server derives attributes and validates pairing membership; client-supplied attribute/image URLs are ignored.

| Route | Behavior |
| --- | --- |
| `/api/pairing-state` | Read states for `image`, `preview`; no new paid generation. |
| `/api/generate-pairing-image` | Explicit image job; duplicate/cached requests reused. |
| `/api/preview-outfit` | Also requires `image`, the exact original data URL; validated against its session hash. |
| `/api/find-similar` | Up to six filtered products using Lens when possible, otherwise Shopping text search. |

Generation states are `idle`, `setup_required`, `pending`, `processing`, `succeeded`, or `failed`, with an optional `asset_url`, `message`, `code`, `retryable`, `method` and provenance. Explicit failed-job retries add `retry: true`. The browser polls every five seconds while active, stops when hidden/closed or after ten minutes, and offers manual status checks. Requests have timeouts, duplicate protection and per-IP bounds. The server follows the existing prototype's opaque session-ID access convention; account authentication was not added.

## Verification

```sh
npm run build
npm test
npm run test:browser
# Explicit live check of a text-only garment image, using API credits:
node scripts/verify-outfit-features.mjs --garment-only
# Explicit live original-reference preview; only use a consented photo:
node scripts/verify-outfit-features.mjs /path/to/top.jpg "Visible original top description"
```

The live script uses indigo jeans, reuses successful cached assets and never retries failed paid generations automatically. It records missing keys and actual outcomes in `test-results/outfit-live-results.json`. Review returned images visually; passing HTTP status is not a quality check.

Official integration references checked during implementation: [OpenAI Images](https://developers.openai.com/api/docs/guides/image-generation), [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [GPT Image 1.5](https://developers.openai.com/api/docs/models/gpt-image-1.5), [SerpApi Lens](https://serpapi.com/google-lens-api), [SerpApi Shopping](https://serpapi.com/google-shopping-api), and [Neobrutalism components](https://www.neobrutalism.dev).
