# Outfit feature verification — 13 September 2026

Implemented generated suggestion images, similar-product search, original-reference 2D previews, and interactive GLBs. The latest request changes the default 3D path to OpenAI-assisted garment parameters plus locally built geometry. Meshy remains optional and requires an explicit provider setting.

## Automated checks

- `npm run build`: passed, including application syntax checks and catalogue build. This native JavaScript project has no separate TypeScript or lint command.
- `npm test`: **52 passed**, including existing upload/provider/catalogue regressions, session ownership, original-reference validation, image caching, duplicate jobs, malformed assets, Meshy timeout/resumption, OpenAI-only generation, GLB geometry/colours and search parsing/fallback.
- After the final material colour-space correction, the affected generation/geometry suite passed **14/14**. The final generation/geometry/search check passed **26/26**.
- `npm run test:browser`: **10 passed** in Chromium. Tests use the explicit sample-only browser server; no paid providers are called. Coverage includes all three example pairings, correct per-pairing images/GLBs, product prices/missing prices, retries, refresh/reupload cache recovery, reset/stale responses, keyboard focus, mobile widths 320/390, desktop 1280, drag rotation and reset. The new OpenAI-mode test loads 3D without generating a 2D preview first.
- `git diff --check`: passed.

Browser screenshots use honest sample labels and are UI evidence, not proof of live image reconstruction:

- [Cards and similar pieces](test-results/features-cards-products-desktop.png)
- [Desktop outfit dialog](test-results/outfit-preview-desktop.png)
- [Mobile outfit dialog](test-results/outfit-preview-mobile.png)
- [Mobile empty search](test-results/features-mobile-empty.png)
- [Fixture front](test-results/model-front.png), [dragged viewpoint](test-results/model-dragged.png), [back](test-results/model-back.png)

## Live and cached checks

| Check | Actual outcome |
| --- | --- |
| OpenAI garment image | One live image-generation request succeeded. Visually inspected: front-facing indigo straight-leg jeans on a plain background, no person, text, logos or accessories. Subsequent checks reused the persisted image. |
| OpenAI-assisted 3D | One live text-only structured-output request succeeded for a white short-sleeve T-shirt and indigo straight-leg jeans. Local code built a self-contained GLB. No original photo or Meshy request was used. |
| Saved 3D rendering | Loaded the actual GLB in locally served model-viewer. Inspected front, side and back: head, torso, arms, hands, legs and feet present, with both garments visible. Mouse drag changes the viewpoint; wheel changes camera distance; no page errors. |
| Colour correction | Visual inspection caught OpenAI choosing purple CSS indigo. Added stable garment swatches and linear glTF material conversion, then rebuilt the saved OpenAI response locally without another API call. The final model uses denim blue. |
| SerpApi Shopping | An earlier authorized account check accepted the configured key; a live query returned HTTP 200 with Google's explicit no-results message. The shorter revised query and 25-second timeout are covered by tests, but their live check was rejected by automatic approval review. No usable live listings or product destinations were verified. |
| SerpApi Lens | Not live-tested: `PUBLIC_ASSET_ORIGIN` is unset, so localhost uses Shopping text fallback. |
| Original-reference 2D preview | Adapter and browser flow tested with controlled responses. Live photo transmission to OpenAI was rejected by automatic approval review; visual fidelity to the original remains unverified. |
| Optional Meshy reconstruction | Mocked task lifecycle/download tests pass. No live Meshy job was submitted; user chose the OpenAI alternative. |

Actual saved OpenAI-assisted model evidence:

- [Front](test-results/openai-model-front.png), [side](test-results/openai-model-side.png), [back](test-results/openai-model-back.png)
- [Model browser checks](test-results/openai-model-browser.json)
- [Live check report](test-results/outfit-live-results.json)
- [GLB file](data/generated/a13aa9ac35550eef17fb868d5d550094a5d8ae6b04c8baa94c96196613d72bad-cc702f7b27cd4ae0b93854f77eb6bc3b.glb)
- [Generated garment image](data/generated/09621e2243efab3a5bf93fb3f006a90891ba3e9aba2c38003ece8d428caca5d5-db6adb3cd05b4f9590c4fd9398dff55f.png)

These local evidence/cache files are ignored by Git. Playwright replaces `test-results` on its next run; preserve it before rerunning. The capture script renders an existing model without contacting a provider.

## Remaining limits and smallest next steps

The OpenAI model is a simplified parametric outfit sketch, not image-to-3D reconstruction. Garment colours and broad silhouettes are represented; printed patterns, fabric textures, collars/buttons and fine drape are simplified. Dimensions are fixed and unrelated to a user's body or fit. OpenAI API charges still apply. No Meshy key is needed for the default path.

To finish the remaining live checks, approve sending the local white T-shirt verification photo (`/tmp/heytwin-verification/top.jpg`) to the OpenAI image-edit endpoint and using the configured SerpApi key for one text-only Shopping query. Automatic approval review rejected the first because the specific image/destination and possible charge had not been approved; it rejected the second because transmitting that credential lacked explicit approval. These actions were not retried after rejection.

There is no production deployment or distributed queue. Restart the development server and open `http://localhost:4173`; upload/confirm a garment, find pairings, then **Preview outfit → Explore in 3D**. Configuration and retention details are in [FEATURE_SETUP.md](FEATURE_SETUP.md).

## Pairing-image fix — 13 September 2026

Reproduced `404 NOT_FOUND` from `/api/pairing-state` and `/api/generate-pairing-image` on the user's port 4173. The listener had started at 11:55, before the backend route changes at 12:51. It served current frontend files but retained the previous backend in memory. Restarted the app and changed `npm run dev` to `node --watch server.mjs` so imported backend changes reload automatically. A request without a session now reaches the generation route's `410 SESSION_EXPIRED` validation instead of returning route-not-found.

Per the user's clarified preference, each new pairing automatically requests its suggested garment image. The right-hand image slot shows progress, then the generated PNG; the left-hand upload remains unchanged. Cached results skip generation. Failures remain on their own card and require manual retry, including after unrelated rerenders. Sample pairings remain explicitly separate.

- Updated browser suite: **11/11 passed**, including top/bottom upload, automatic generation on all cards, side-by-side placement, manual retry, no rerender duplicates and refresh/cache reuse.
- Build and diff checks passed.
- One live OpenAI text-only request generated cream wide-leg trousers. The verification upload and garment identification/styling stayed local and controlled; no user photo was sent externally.
- Rechecked the generated image from cache on the actual pairing-page UI, desktop and 390-pixel mobile: original unchanged, images adjacent, no failed API responses, no console errors.
- [Desktop evidence](verification/image-generation/pairing-desktop.png), [mobile evidence](verification/image-generation/pairing-mobile.png), [cached verification report](verification/image-generation/result.json).
- Reusable verifier: `node scripts/verify-pairing-image.mjs`. Its cache is isolated from the app's single-writer manifest; it permits at most one text-only image request and reuses successful cached output.

After the backend restart, refresh localhost:4173 and upload/confirm the garment again to create a current session.
