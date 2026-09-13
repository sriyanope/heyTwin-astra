# Outfit features

Run `npm ci`, then `npm run dev`, and open **http://localhost:4173**. Upload a top or bottom, confirm its description, and select **Find my pairings**. Suggested garment images generate automatically when the pairings appear, beside the unchanged original photo. Cached images appear immediately; failures offer **Retry image**. Each card also offers **Find similar** and **Preview outfit**. Inside the dialog, select **Explore in 3D** for a simplified model from the confirmed garment descriptions. Generating the 2D mannequin image is a separate action; only the optional Meshy path requires it first. Drag/touch rotates the GLB, wheel/pinch zooms, and **Reset view** restores the camera.

OpenAI supplies structured garment colours and shapes; local deterministic geometry builds the GLB. This is OpenAI-assisted parametric modelling, not native OpenAI image-to-3D reconstruction. Patterns, textures and fine design details are simplified. OpenAI API charges still apply, but no Meshy account or credits are required by default.

The original stays unchanged on the card. The mannequin is an approximate outfit visualization: it cannot establish physical fit, and unseen details may differ. There is no cloth simulation, measurement inference or checkout.

## Configuration

Add values to `.env` locally and restart the server. Keep the existing vision/styling configuration. Never put credentials in `public/`.

| Variable | Source and purpose |
| --- | --- |
| `IMAGE_API_KEY` | Optional separate OpenAI key for generated images. `OPENAI_API_KEY` also works. When vision uses the official `https://api.openai.com` origin, the adapter can reuse `VISION_MODEL_API_KEY`. |
| `IMAGE_MODEL` | Defaults to documented `gpt-image-1.5`. |
| `IMAGE_QUALITY` | Defaults to `medium`. Garment output is 1024×1024; mannequin output is 1024×1536. |
| `IMAGE_TIMEOUT_MS` | Request deadline; `.env.example` recommends 180000. No automatic paid retry. |
| `SERPAPI_API_KEY` | Obtain from [SerpApi API key management](https://serpapi.com/manage-api-key). Enables Google Lens and Google Shopping. |
| `PUBLIC_ASSET_ORIGIN` | Optional public HTTPS origin of this app, e.g. `https://your-deployment.example`. It must serve the app's `/generated/` URLs. Localhost cannot be used by Lens; without a public origin, text search works. This is not a credential. |
| `MODEL_3D_PROVIDER` | Defaults to `openai`. Only explicit `meshy` enables paid Meshy jobs. Having a Meshy key alone never enables them. |
| `MODEL_3D_MODEL` | Defaults to the existing `VISION_MODEL`, then `gpt-5.6-terra`. Must support structured JSON output. |
| `MODEL_3D_API_KEY` | Optional separate OpenAI key; otherwise reuses the image/OpenAI key, or the vision key when its origin is official OpenAI. |
| `SERPAPI_TIMEOUT_MS` | Defaults to 25000; bounded to 10000–45000 ms. |
| `MESHY_API_KEY` | Optional. Create in [Meshy API settings](https://www.meshy.ai/settings/api); see [authentication](https://docs.meshy.ai/en/api/authentication). |
| `MESHY_TIMEOUT_MS` | Per-request deadline, default 30000. |
| `MESHY_POLL_MS`, `MESHY_MAX_POLLS` | Defaults 5000 and 120 (a bounded approximately 10-minute window). A timed-out known task is checked again on explicit retry without submitting a duplicate job. |

Missing credentials produce setup states; normal use never silently receives fixture products or mannequin models. Visual search uses only the isolated generated suggestion. Text fallback uses structured garment details, including before image generation. Products have source-provided links and prices only; delivery, availability, and exact matches are not promised.

## Persistence and demo use

This prototype runs as one Node process with one writable `data/generated` directory. Its serialized, atomic manifest and opaque image/GLB files survive restarts. Retain this directory on a persistent volume for reliable demos. Reupload the same original and confirm the same attributes to reopen its own preview/model; generated garment images can be shared across equivalent suggestions. Successful outputs loaded after restart show a cached label. A new process resumes known Meshy tasks; interrupted submissions with no task ID require an explicit retry and disclose that an earlier charge may have occurred.

This is a file-backed prototype, not a distributed job queue. Multiple processes must not write the same cache. Generated assets remain until the operator removes their records/files while the server is stopped. Their opaque URLs are accessible without a session so image providers and Lens can retrieve them; there is no directory listing or arbitrary URL-fetch proxy. Original uploads are never written to disk. Discarding a session removes its in-memory attributes and authorization, not already generated assets.

Browser fixtures have separate authored PNG/GLB assets, returned only by `tests/browser-server.mjs` with `source_state: sample`. They are a reliable local UI demo, explicitly labelled as samples, and do not establish live provider quality. They are never injected by `npm run dev`.

## Route contract

All feature routes are JSON POST requests requiring `{ garment_id, pairing_id }` from the current confirmed session. The server derives attributes and validates pairing membership; client-supplied attribute/image URLs are ignored.

| Route | Behavior |
| --- | --- |
| `/api/pairing-state` | Read states for `image`, `preview`, `model`; no new paid generation. |
| `/api/generate-pairing-image` | Explicit image job; duplicate/cached requests reused. |
| `/api/preview-outfit` | Also requires `image`, the exact original data URL; validated against its session hash. |
| `/api/generate-outfit-model` | OpenAI: confirmed original/suggested text attributes → validated parameters → local GLB. Optional Meshy: completed mannequin image → downloaded GLB. |
| `/api/find-similar` | Up to six filtered products using Lens when possible, otherwise Shopping text search. |

Generation states are `idle`, `setup_required`, `pending`, `processing`, `succeeded`, or `failed`, with an optional `asset_url`, `message`, `code`, `retryable`, `method` and provenance. Model method is `openai-parametric` or `meshy`, including before generation. Explicit failed-job retries add `retry: true`. The browser polls every five seconds while active, stops when hidden/closed or after ten minutes, and offers manual status checks. Requests have timeouts, duplicate protection and per-IP bounds. The server follows the existing prototype's opaque session-ID access convention; account authentication was not added.

## Verification

```sh
npm run build
npm test
npm run test:browser
# Explicit live check of a text-only garment image, using API credits:
node scripts/verify-outfit-features.mjs --garment-only
# Explicit live text-only 3D model (no photo, no Meshy); skip shopping if not approved:
node scripts/verify-outfit-features.mjs --text-model --skip-search
# Render the saved model locally and test drag/zoom:
node scripts/capture-outfit-model.mjs
# Explicit live original-reference preview; only use a consented photo:
node scripts/verify-outfit-features.mjs /path/to/top.jpg "Visible original top description"
```

The live script uses indigo jeans, reuses successful cached assets and never retries failed paid generations automatically. It records missing keys and actual outcomes in `test-results/outfit-live-results.json`. Review returned images and models visually; passing HTTP status is not a quality check.

Official integration references checked during implementation: [OpenAI Images](https://developers.openai.com/api/docs/guides/image-generation), [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [GPT Image 1.5](https://developers.openai.com/api/docs/models/gpt-image-1.5), [SerpApi Lens](https://serpapi.com/google-lens-api), [SerpApi Shopping](https://serpapi.com/google-shopping-api), [Meshy image-to-3D](https://docs.meshy.ai/en/api/image-to-3d), [model-viewer](https://modelviewer.dev/docs/index.html), and [Neobrutalism components](https://www.neobrutalism.dev).
