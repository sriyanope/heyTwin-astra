# Role: Backend Developer

## Mission

Build the minimal server endpoints, request validation, and server-side secret handling for heyTwin's garment-to-outfit flow. Avoid unnecessary persistence: no full user accounts or auth, and no database beyond what a favourite-save prioritised addition might need — and even that should default to a client-local approach if inexpensive (see [`PRODUCT_BRIEF.md`](../PRODUCT_BRIEF.md) Prioritised Additions).

## Responsibilities

- Create backend endpoints for garment analysis, confirmation, and outfit recommendation.
- Validate image uploads (format, size, presence of a garment).
- Integrate the runtime vision/recommendation model call server-side.
- Normalize model outputs into heyTwin's response schema.
- Implement sample fallback responses when the live model call fails.
- Ensure the model's API key stays backend-side and environment-only.
- Enforce privacy defaults: do not store uploaded images by default.

## Core Endpoints

- `GET /health`
- `POST /api/analyze-garment`
- `POST /api/confirm-garment`
- `POST /api/recommend-outfits`
- `POST /api/refine-outfit` (prioritised addition)

Keep this list in sync with [`API_CONTRACTS.md`](../API_CONTRACTS.md), which is the authoritative contract.

## Backend Rules

- Do not store uploaded garment images by default.
- Do not log raw images.
- Do not expose the runtime model's API key. Reference it generically (e.g. "the vision/recommendation model API key") — the runtime provider is unverified/TBD, and this file must not name a specific vendor.
- Return structured JSON, including `ownership` (`"user_item" | "suggested_item"`) and `source_state` on every outfit item.
- Use a sample fallback if the live model call fails, and mark it honestly via `source_state`.
- Keep response schemas stable and in sync with `API_CONTRACTS.md`.
- Avoid unnecessary persistence or authentication infrastructure — this is a 5-hour hackathon build, not a production account system.

## Error Codes

- `INVALID_IMAGE`
- `IMAGE_TOO_LARGE`
- `GARMENT_NOT_DETECTED`
- `MODEL_API_ERROR`
- `LOW_CONFIDENCE_IDENTIFICATION`
- `FALLBACK_USED`

## Definition of Done

- [ ] Health endpoint works
- [ ] Garment analysis endpoint works
- [ ] Runtime model integration works, or a mock wrapper exists
- [ ] Sample fallback works
- [ ] API key is environment-only
- [ ] Response schema matches `API_CONTRACTS.md`
- [ ] Uploaded images are not stored by default
- [ ] No unnecessary auth/persistence was added

## Dependencies / Handoffs

- Depends on the API Integration Engineer to confirm the runtime provider's actual access, capability, and latency constraints before this role commits to an integration shape.
- Depends on the AI Engineer's output schema (attributes, confidence, ownership tagging, explanations) to know what to normalize and return.
- Hands working endpoints to the Frontend Developer.
- Hands known failure scenarios and fallback behavior to the QA Tester.

## Scope Boundaries (Out of Scope for This Role)

- Does not choose or negotiate the runtime AI vendor relationship itself — that is the API Integration Engineer's job.
- Does not design the UI or decide screen-level copy.
- Does not add authentication or a database beyond what is minimally needed for the essential flow (and the optional local favourite-save).
