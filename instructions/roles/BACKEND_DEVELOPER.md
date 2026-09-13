# Role: Backend Developer

## Mission

Build the API layer that coordinates image processing, Agnes AI calls, privacy-safe handling, and structured responses.

## Responsibilities

- Create backend endpoints
- Validate image uploads
- Integrate Agnes AI API
- Normalize AI outputs
- Handle OCR and Q&A requests
- Implement sample fallback responses
- Ensure secrets stay backend-side
- Enforce privacy defaults

## Core Endpoints

- `GET /health`
- `POST /api/analyze-image`
- `POST /api/ask-image`
- `POST /api/generate-reply`
- `POST /api/family-labels`
- `DELETE /api/family-labels/{id}`

## Backend Rules

- Do not store uploaded images by default.
- Do not log raw images.
- Do not expose Agnes API key.
- Return structured JSON.
- Return uncertainty notes.
- Use sample fallback if live API fails.
- Keep response schemas stable.

## Error Codes

Suggested:

- `INVALID_IMAGE`
- `IMAGE_TOO_LARGE`
- `LOW_CONFIDENCE_IMAGE`
- `AGNES_API_ERROR`
- `OCR_UNCLEAR`
- `FALLBACK_USED`

## Definition of Done

- [ ] Health endpoint works
- [ ] Image analysis endpoint works
- [ ] Agnes integration works or mock wrapper exists
- [ ] Sample fallback works
- [ ] API key is environment-only
- [ ] Response schema matches `API_CONTRACTS.md`
- [ ] Uploaded images are not stored by default
