# Connected outfit features

This task supersedes the earlier planning exclusions for generated visuals, similar-product search and a neutral mannequin preview. Physical fit, measurement inference, checkout and cloth simulation remain outside scope.

| Task | Subtasks | Owner | Dependencies |
| --- | --- | --- | --- |
| 1. Contracts and integration | Inspect app/instructions; map suggestion attributes; stable pairing identity; validate session ownership and original reference; serve cached assets; add bounded request limits | Primary agent | Existing upload/confirmation flow |
| 2. Generated visuals | Verify official API docs; garment image adapter; original-reference mannequin edit; persistent assets and job manifest; deduplicate; setup/error/retry states; unit tests | Terra generation agent | Structured attributes and original-photo hash |
| 3. Similar pieces | Verify SerpApi docs; Lens search; Shopping text fallback; category filter, evidence ranking and deduplication; source prices/links; timeout and parser tests | Terra search agent | Attributes; optional public generated image URL |
| 4. 3D asset lifecycle | Default OpenAI structured garment parameters; local fixed-proportion mannequin GLB; schema/geometry tests; optional Meshy creation/polling and trusted downloads; persistent cache | Terra generation agent | Confirmed garment attributes; completed mannequin image only for optional Meshy |
| 5. Interface | Existing card design; explicit image action; similar product listings; accessible preview dialog; real model viewer, zoom/reset; state isolation; readable failure/provenance copy | Terra UI agent | Shared route contracts; tasks 2–4 |
| 6. Validation and handoff | API integration tests; existing regressions; controlled browser fixture with real GLB; desktop/mobile/focus/rotation screenshots; minimal live checks with configured providers; setup and limitations | Primary agent | Integrated implementation |

Generation is explicitly requested, never triggered by rerenders. Original uploads stay transient; generated images and models persist under `data/generated`. Cached output identity includes generation settings and relevant attributes. Reuploading the same photo after refresh can recover matching cached assets without another paid job.

The implementation does not depend on the clothing scraper. Product listings are provider results; browser-test fixtures must never appear in normal use. Review outcomes are recorded in `FEATURE_VERIFICATION.md`.
