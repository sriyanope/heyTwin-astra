# heyTwin

A small, mobile-first styling demo: upload one top or bottom, check the AI’s description, and see complementary pieces alongside your original photo.

## Run

Requires Node.js 22 or newer. The application has no runtime dependencies.

```sh
cp .env.example .env  # only if .env does not already exist
# Set VISION_MODEL_API_KEY in .env
npm run dev
```

Open **http://localhost:4173**. `PORT` is configurable. Restart the server after editing `.env`. The server also listens on the local network for phone testing. No hosting provider or public deployment is configured in this repository.

## AI configuration

The user-selected runtime model is `gpt-5.6-terra`. Its [official model documentation](https://developers.openai.com/api/docs/models/gpt-5.6-terra) lists image input and structured outputs. The adapter uses Chat Completions with JSON output, validated by the server before use.

```dotenv
VISION_MODEL_BASE_URL=https://api.openai.com/v1
VISION_MODEL=gpt-5.6-terra
VISION_MODEL_API_KEY=your-private-key
VISION_TIMEOUT_MS=45000
```

`VISION_API_URL` (complete chat-completions endpoint) and `VISION_API_KEY` remain supported for compatibility with the starter. Prefer the variables above. Keys stay server-side; `.env` is ignored. Missing credentials, unavailable models and provider failures produce an error with retry, never fixed recommendations in the live upload flow.

## Implemented

- JPG, PNG and WebP upload up to 8 MB, separate camera action, browser image decoding, original preview, replacement and reset. HEIC is not accepted; export it as JPEG first.
- Vision identification of category, colour, pattern and visible description; unclear photos request a clearer image.
- Mandatory confirmation with editable category, colour, pattern, description and optional occasion. Corrected attributes are authoritative in recommendation prompts.
- One to three distinct AI-selected complementary pieces from eight local illustrations. Every outfit contains a top and bottom, labels **Your item** and **Suggested pairing**, and includes a short explanation.
- Original photo displayed unchanged with `object-fit: contain`. Suggested images are explicitly illustrative; no product availability or ownership is implied.
- Separate, clearly labelled prepared sample, accessible loading/errors, request timeouts, retry, and stale-request protection.

The original SVG catalogue is authored for heyTwin under the repository’s MIT licence. `data/catalogue.mjs` defines valid IDs and descriptions; `scripts/build-catalogue.mjs` produces the images. No external catalogue URLs are accepted from the model. The limited palette and silhouettes constrain recommendation variety.

## API and retention

The implementation follows the illustrative endpoints in `instructions/API_CONTRACTS.md`, adding `description` to editable attributes and `name` to outfits. Category uses `top` or `bottom`; the more specific garment shape belongs in `description`.

| Endpoint | Request |
| --- | --- |
| `GET /health` | Returns service health and whether provider configuration is present (not a credential-validity check). |
| `POST /api/analyze-garment` | `{ image: "data:image/jpeg;base64,..." }` → attributes, confidence, uncertainty, `garment_id`, `source_state`. |
| `POST /api/confirm-garment` | `{ garment_id, corrected_attributes: { category, colour, pattern, description } }` |
| `POST /api/recommend-outfits` | `{ garment_id, confirmed_attributes, occasion }` → `outfits`, with two ownership-tagged items each. Occasion is `casual`, `work`, `going_out` or null. |
| `POST /api/discard-garment` | `{ garment_id }` → removes temporary attributes on reset. |

Photos stay in browser memory and in the transient analysis request; heyTwin never saves or logs them. Only analysis and corrected attributes are held server-side for up to 15 minutes (cleaned at one-minute intervals), or until reset. Provider data handling is governed by its own policies. Refreshing the page loses the photo. No accounts, database or local storage.

## Verify

```sh
npm ci
npm run build
npm test
npx playwright install chromium
npm run test:browser
```

API and browser tests use controlled provider responses; they do **not** establish live model quality. Browser checks exercise the complete app at 390px width, corrections, visual loading, reset and failures. Optional `PLAYWRIGHT_EXECUTABLE_PATH` selects an existing Chromium installation.

For explicit live checks (uses API credits), start the configured app, then supply two consented JPEG photos:

```sh
node scripts/verify-live.mjs /path/to/top.jpg /path/to/bottom.jpg
node scripts/verify-live-browser.mjs /path/to/top.jpg /path/to/bottom.jpg
```

Live reports and screenshots go to ignored `test-results/`. See [VERIFICATION.md](VERIFICATION.md) for what was actually run. The planning files under `instructions/` are preserved as requested.
