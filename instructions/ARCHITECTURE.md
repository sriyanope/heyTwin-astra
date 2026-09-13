# Architecture

> Product scope lives in [`PRODUCT_BRIEF.md`](PRODUCT_BRIEF.md). This document describes how the system is structured to deliver that scope — it does not restate the product rationale.

## System Overview

heyTwin consists of:

- **Frontend app** for garment capture/upload, garment attribute confirmation (with user corrections), optional occasion selection (casual/work/going out), and visual outfit board display.
- **Backend API** for garment-image validation and orchestration of the vision/recommendation model call.
- **Runtime AI/vision provider integration** — the service that identifies garment attributes and generates outfit recommendations. **The specific provider is unverified/TBD.** This is a named open risk; see [`PRODUCT_BRIEF.md`](PRODUCT_BRIEF.md#product-risks) and [`DECISIONS.md`](DECISIONS.md) ADR-004. Note: **Astra is the AI development/coding platform used to build this app — it is not this runtime provider.**
- **Optional local sample-image/sample-response fallback** for demo reliability if the live model call is slow, unavailable, or unverified at demo time.

## High-Level Flow

```text
Image input
  -> Frontend validation
  -> Backend upload endpoint
  -> Garment attribute identification
  -> User confirmation/correction
  -> Occasion input (optional)
  -> Outfit recommendation generation
  -> Visual presentation (your item vs suggested items)
  -> Explanation generation
```

## Repository Structure

> **Suggested structure only.** No application code exists in this repository yet (verified: `instructions/` is documentation-only). The stack itself is not yet decided — a lightweight mobile-first web app (e.g. Next.js/React frontend + FastAPI/Express backend) is a reasonable default consistent with a 5-hour build, not a confirmed choice. Adjust freely once the team picks a stack.

```text
heytwin/
  frontend/
    app/
    components/
      capture/
      confirm/
      occasion/
      outfits/
      accessibility/
    lib/
      api.ts
      types.ts
  backend/
    api/
      routes/
    services/
      vision/
      recommendation/
      privacy/
    models/
    tests/
  data/
    sample_garments/
    sample_responses/
  docs/
  README.md
  AGENTS.md
  CLAUDE.md
```

## Frontend Responsibilities

- Let the user capture or upload a photo of one top or bottom.
- Show identified garment attributes (category, colour, pattern) with confidence.
- Let the user confirm or correct the identified attributes before recommendations are generated.
- Offer an optional occasion selector (casual/work/going out).
- Display the resulting outfit board visually, with the user's own garment clearly identifiable in every outfit.
- Visually distinguish `user_item` from `suggested_item` in every outfit shown.
- Show a short plain-language explanation for each outfit.
- Make uncertainty and confidence visible in plain language.
- Show whether displayed output is live, cached, sample, or fallback.
- Give the user a clear retry path (e.g. a different photo) on failure.

## Backend Responsibilities

- Validate garment image input (format, basic clarity checks).
- Send the garment image to the runtime vision/recommendation provider (unverified/TBD — see System Overview).
- Normalize provider output into stable API contracts (see [`API_CONTRACTS.md`](API_CONTRACTS.md)).
- Apply user-confirmed attribute corrections before requesting recommendations.
- Generate outfit recommendations tagged with `ownership` for every item.
- Generate short, plain-language explanations referencing the visible attributes of the user's garment.
- Return confidence and uncertainty notes.
- Avoid storing garment images by default (see [`ENVIRONMENT.md`](ENVIRONMENT.md) `STORE_GARMENT_IMAGES_BY_DEFAULT`).
- Support sample/fallback responses for demo reliability, always labelled honestly via `source_state`.

## Runtime AI/Vision Provider Responsibilities

> Placeholder responsibilities for whichever provider is confirmed during the first ~30 minutes of the build. Do not assume a specific vendor or that hackathon Astra credits include runtime inference or image generation.

- Identify garment category, colour, pattern, and other clearly visible attributes with a confidence score per attribute.
- Generate or select complementary outfit items given confirmed attributes and optional occasion.
- Communicate uncertainty rather than guessing with false confidence.
- Avoid inventing garment attributes not visibly supported by the image.

## Data Entities

### GarmentAnalysis

```json
{
  "garment_id": "string",
  "category": "string",
  "colour": "string",
  "pattern": "string",
  "confidence": 0.0,
  "uncertainty_note": "string",
  "source_state": "live"
}
```

### OutfitRecommendation

```json
{
  "outfit_id": "string",
  "items": [
    {
      "item_id": "string",
      "ownership": "user_item",
      "category": "string",
      "image_ref": "string"
    },
    {
      "item_id": "string",
      "ownership": "suggested_item",
      "category": "string",
      "image_ref": "string"
    }
  ],
  "occasion": "casual",
  "explanation": "string",
  "confidence": 0.0,
  "source_state": "live"
}
```

### SavedFavorite (prioritised addition — not MVP)

> Only relevant if local-save is built. [`PRODUCT_BRIEF.md`](PRODUCT_BRIEF.md) prefers browser-local storage as the default if this is added at all — a server-side entity may not be needed.

```json
{
  "favorite_id": "string",
  "outfit_id": "string",
  "saved_at": "string"
}
```

## External Integrations

| Service | Purpose | Mode |
|---|---|---|
| Runtime vision/recommendation model | Garment identification + outfit recommendation | **Unverified/TBD** — do not assume "Live"; confirm provider and capability in the first 30 minutes of the build (see [`DECISIONS.md`](DECISIONS.md) ADR-004) |
| Image catalogue source (if used for suggested items) | Source of suggested-item imagery | Provenance must be documented by the team per [`PRODUCT_BRIEF.md`](PRODUCT_BRIEF.md) — do not assume a licensed or live catalogue |
| Local sample data | Demo fallback | Mock |

## Reliability Strategy

- Use sample garment images and sample outfit responses as backup if the live provider is slow, unavailable, or unconfirmed.
- Keep response schemas stable regardless of whether output is live or fallback.
- Show fallback/sample state honestly in the UI via `source_state` — never let fallback data pass as live.
- Do not block the whole app if a single model call fails; fail the affected step only.
- Let the user retry with a different photo rather than dead-ending on failure.
- Prioritise one reliable end-to-end outfit result over three unreliable ones, per [`PRODUCT_BRIEF.md`](PRODUCT_BRIEF.md).
