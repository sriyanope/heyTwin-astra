# Backend Guide

> Product scope: see [`PRODUCT_BRIEF.md`](PRODUCT_BRIEF.md). This document does not restate scope, only backend responsibilities.

## Framework

No backend framework has been chosen yet for heyTwin. **FastAPI** or **Express** are reasonable candidates and may be retained as a labeled suggestion if the team already has a suitable existing stack — this is not a decision that has been made, and no framework migration should happen without concrete necessity.

## Responsibilities

The backend is responsible for:

- Garment image upload handling
- Image validation (file type, size, basic sanity checks)
- Runtime vision/recommendation model integration (provider **unverified/TBD** — see [Runtime Model Integration](#runtime-model-integration))
- Response normalization into the your-item / suggested-item schema (see [`API_CONTRACTS.md`](API_CONTRACTS.md))
- Occasion-aware recommendation logic (casual / work / going out)
- Privacy-safe temporary image processing
- Demo fallback responses

## Core Endpoints

Keep endpoint names in sync with [`API_CONTRACTS.md`](API_CONTRACTS.md) — the table below reflects the expected shape, not a final confirmed contract.

| Endpoint | Method | Purpose |
|---|---:|---|
| `/health` | GET | Health check |
| `/api/analyze-garment` | POST | Analyse an uploaded garment photo and return identified attributes with confidence |
| `/api/confirm-garment` | POST | Submit user corrections to identified attributes before recommendations are generated |
| `/api/recommend-outfits` | POST | Generate outfit recommendations built around the confirmed garment, optionally scoped by occasion |
| `/api/refine-outfit` | POST | *(Prioritised addition, not MVP)* Apply one refinement action (e.g. "make it more casual", "change the shoes") to an existing recommendation |

## AI Orchestration

```text
Validate image
  -> Send image to vision/recommendation provider (unverified/TBD)
  -> Request garment attribute identification
  -> Apply user corrections (from /api/confirm-garment)
  -> Apply occasion input if given
  -> Generate outfit recommendations
  -> Generate short explanations for each recommendation
  -> Return structured response with ownership labels + source_state
```

## Runtime Model Integration

This section was previously written around a specific vendor ("Agnes AI") for the earlier FamLens direction. That vendor does not apply to heyTwin. **The specific runtime vision/recommendation provider or model is not yet decided.** GPT Astra is the development platform used to build heyTwin — it is not necessarily the runtime service the deployed app calls at inference time, and hackathon Astra credits should not be assumed to include runtime inference or image generation.

Confirming the runtime provider is a first-priority task: the **API Integration Engineer** should resolve this within the first ~30 minutes of the build window, per [`ROADMAP.md`](ROADMAP.md) and ADR-004 in [`DECISIONS.md`](DECISIONS.md).

Whatever provider is selected, the integration should support:

- Garment attribute identification (category, colour, pattern, and other clearly visible attributes)
- Outfit recommendation generation
- Explanation generation (short, plain-language reasoning for each outfit)

Do not hardcode AI outputs except as a clearly labeled demo fallback (see [Fallback Strategy](#fallback-strategy)).

## Privacy Rules

- Do not store uploaded garment images by default.
- Delete temporary images after processing where feasible.
- Do not log raw image data (including base64).
- Do not log secrets or API keys.

See [`ACCESSIBILITY_PRIVACY.md`](ACCESSIBILITY_PRIVACY.md) for the full privacy posture.

## Error Handling

Return user-facing errors:

```json
{
  "error": {
    "code": "GARMENT_NOT_DETECTED",
    "message": "I couldn't clearly identify a garment in this photo. Try a clearer photo, or continue and describe it yourself.",
    "recoverable": true
  }
}
```

`IMAGE_UNCLEAR` is an equivalent code for a garment that is visible but too ambiguous to confidently attribute (blur, poor lighting, partial view).

## Fallback Strategy

If the runtime model call is unavailable or fails:

- Use committed sample responses for the demo.
- Return `source_state: "sample"` (or `"fallback"` as appropriate).
- Show the fallback state honestly in the frontend.
- Do not pretend fallback data is live.

## Security

- Store the vision/recommendation model API key backend-only, in whatever `.env` variable name is defined in [`ENVIRONMENT.md`](ENVIRONMENT.md) — do not introduce a differently-named variable without updating that document.
- Never expose the API key to the frontend.
- Validate file type and file size on upload.
- Reject unsafe uploads.
- Sanitize any generated text before display.
