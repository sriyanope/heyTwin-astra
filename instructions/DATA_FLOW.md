# Data Flow

> Product scope lives in [`PRODUCT_BRIEF.md`](PRODUCT_BRIEF.md). Privacy posture lives in [`ACCESSIBILITY_PRIVACY.md`](ACCESSIBILITY_PRIVACY.md). This document describes how data moves through heyTwin.

## Overview

```text
Garment image
  -> Frontend validation
  -> Backend upload endpoint
  -> Garment attribute identification
  -> User confirmation/correction
  -> Occasion input (optional)
  -> Outfit recommendation generation
  -> Visual presentation (your item vs suggested items)
  -> Explanation generation
```

## Input Data

User provides:

- Garment image (one top or bottom)
- Optional occasion selection (casual/work/going out)
- Optional detail preferences (if the team adds any — not part of the essential flow)

Example:

```json
{
  "image": "olive_blouse.jpg",
  "occasion": "work"
}
```

## Processing Stages

| Stage | Input | Output | Notes |
|---|---|---|---|
| Intake | Garment image | Validated garment reference | Reject unsupported files or images with no detectable garment |
| Attribute Identification | Validated garment reference | Category, colour, pattern, confidence per attribute | Uses the runtime vision provider — **unverified/TBD**, see [`ARCHITECTURE.md`](ARCHITECTURE.md) |
| Confirmation | Identified attributes + user corrections | Confirmed attributes | User can correct obvious identification mistakes before recommendations are generated |
| Occasion Input | User choice (optional) | Occasion tag | Casual / work / going out |
| Recommendation | Confirmed attributes + occasion | Outfit candidates | Each candidate tags items with `ownership` |
| Presentation | Outfit candidates | Visual outfit board with ownership labels | User's garment clearly identifiable in every outfit |
| Explanation | Outfit candidates | Short plain-language rationale text | Must reference visible attributes of the user's actual garment |

## Source State

Use source states:

- `live`: Generated from a live runtime provider request
- `cache`: Retrieved from a cached response
- `sample`: Demo sample response
- `fallback`: Generated after failure or limited input

Example:

```json
{
  "source_state": "sample",
  "source_label": "Demo fallback outfit set",
  "confidence": 0.7
}
```

Fallback/sample data must never be presented as if it were a live result — the UI must show the `source_state` honestly wherever recommendations are displayed.

## Confidence Rules

Confidence should be used for:

- Garment attribute identification (category, colour, pattern)
- Outfit recommendation relevance/fit-for-occasion

Example:

```json
{
  "confidence": 0.68,
  "uncertainty_note": "The pattern is a little hard to make out in this lighting, so this is a best guess."
}
```

Rules:

- Be honest about uncertainty rather than guessing with false confidence.
- Low-confidence attributes should be surfaced to the user during confirmation, not silently assumed.
- Never infer body type, fit, or size from a garment photo, and never present a recommendation as a guarantee of fit (see [`PRODUCT_BRIEF.md`](PRODUCT_BRIEF.md)).

## Privacy Flow

Default:

```text
Upload garment image
  -> Process temporarily
  -> Return attributes / outfit recommendations
  -> Do not store the image by default
```

This follows the minimal-retention posture in [`ACCESSIBILITY_PRIVACY.md`](ACCESSIBILITY_PRIVACY.md) and [`PRODUCT_BRIEF.md`](PRODUCT_BRIEF.md): a single uploaded garment does not require any consent flow (there is no family-label or person-identification step in this product), so no such consent flow applies here.

### Local favorites (prioritised addition — not MVP)

If "save a favourite" is built, [`PRODUCT_BRIEF.md`](PRODUCT_BRIEF.md) prefers this happen in browser-local storage rather than server-side persistence, since it is inexpensive and avoids adding backend state:

```text
User taps "save"
  -> Outfit reference stored in browser-local storage
  -> Available on return to the app in the same browser
  -> User can remove it at any time
```

## Frontend Rendering Rules

- Show garment attribute confirmation before generating or displaying any recommendations.
- Always visually distinguish `user_item` from `suggested_item` in every outfit shown — never let a suggested item read as already owned.
- Show uncertainty in plain language, not raw confidence scores.
- Show whether output is live, cached, sample, or fallback.
- Prefer showing the first ready outfit as soon as it is available rather than waiting on all three at once, if that meaningfully improves perceived speed — keep this simple and don't over-engineer it for a 5-hour build.
- Give the user a clear retry path (e.g. try another photo) on failure, never a blank screen.
