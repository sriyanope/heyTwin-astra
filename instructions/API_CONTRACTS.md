# API Contracts

> Product scope lives in [`PRODUCT_BRIEF.md`](PRODUCT_BRIEF.md). Architecture context lives in [`ARCHITECTURE.md`](ARCHITECTURE.md). These endpoints are illustrative contracts for the essential flow — no backend implementation exists yet.

## Base URL

Local backend (suggested, not yet decided):

```text
http://localhost:8000
```

Frontend should read (example, assumes a Next.js-style suggestion — see [`ARCHITECTURE.md`](ARCHITECTURE.md) for stack caveat):

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

## Common Types

```ts
type Ownership = "user_item" | "suggested_item";

type SourceState = "live" | "cache" | "sample" | "fallback";

type ConfidenceLevel = "high" | "medium" | "low";

type Uncertainty = {
  level: ConfidenceLevel;
  note: string;
};

type AttributeConfidence = {
  value: string;
  confidence: number;
};

type GarmentAttributes = {
  category: AttributeConfidence;
  colour: AttributeConfidence;
  pattern: AttributeConfidence;
};

type Occasion = "casual" | "work" | "going_out";
```

## POST /api/analyze-garment

Purpose: Upload a photo of one top or bottom and identify its visible attributes.

### Request

```json
{
  "image": "file-reference-or-base64"
}
```

### Response

```json
{
  "garment_id": "garment_001",
  "attributes": {
    "category": { "value": "blouse", "confidence": 0.91 },
    "colour": { "value": "olive green", "confidence": 0.84 },
    "pattern": { "value": "solid", "confidence": 0.77 }
  },
  "confidence": 0.84,
  "uncertainty": {
    "level": "medium",
    "note": "The lighting makes the exact shade of green a little uncertain."
  },
  "source_state": "live"
}
```

## POST /api/confirm-garment

Purpose: Apply user corrections to the identified attributes before recommendations are generated.

### Request

```json
{
  "garment_id": "garment_001",
  "corrected_attributes": {
    "category": "blouse",
    "colour": "dark olive",
    "pattern": "solid"
  }
}
```

### Response

```json
{
  "garment_id": "garment_001",
  "confirmed_attributes": {
    "category": "blouse",
    "colour": "dark olive",
    "pattern": "solid"
  },
  "status": "confirmed"
}
```

## POST /api/recommend-outfits

Purpose: Generate outfit recommendations built around the confirmed garment.

### Request

```json
{
  "garment_id": "garment_001",
  "confirmed_attributes": {
    "category": "blouse",
    "colour": "dark olive",
    "pattern": "solid"
  },
  "occasion": "work"
}
```

### Response

```json
{
  "outfits": [
    {
      "outfit_id": "outfit_001",
      "items": [
        {
          "item_id": "garment_001",
          "ownership": "user_item",
          "category": "blouse",
          "image_ref": "user_upload_001.jpg"
        },
        {
          "item_id": "sugg_101",
          "ownership": "suggested_item",
          "category": "trousers",
          "image_ref": "sample_trousers_black.jpg"
        },
        {
          "item_id": "sugg_102",
          "ownership": "suggested_item",
          "category": "shoes",
          "image_ref": "sample_flats_brown.jpg"
        }
      ],
      "occasion": "work",
      "explanation": "The dark olive blouse pairs well with black trousers for a neutral, professional base, with brown flats keeping the look approachable rather than formal.",
      "confidence": 0.79,
      "source_state": "live"
    }
  ]
}
```

## POST /api/refine-outfit (prioritised addition — not MVP)

> Only build after the essential flow works end to end, per [`PRODUCT_BRIEF.md`](PRODUCT_BRIEF.md).

Purpose: Apply one simple refinement action to an existing outfit recommendation (e.g. "more_casual" or "change_shoes").

### Request

```json
{
  "outfit_id": "outfit_001",
  "action": "more_casual"
}
```

### Response

```json
{
  "outfit_id": "outfit_001",
  "items": [
    {
      "item_id": "garment_001",
      "ownership": "user_item",
      "category": "blouse",
      "image_ref": "user_upload_001.jpg"
    },
    {
      "item_id": "sugg_201",
      "ownership": "suggested_item",
      "category": "jeans",
      "image_ref": "sample_jeans_indigo.jpg"
    }
  ],
  "occasion": "casual",
  "explanation": "Swapping to indigo jeans relaxes the look while keeping the olive blouse as the anchor piece.",
  "confidence": 0.74,
  "source_state": "live"
}
```

## POST /api/favorites (optional/prioritised addition — not MVP)

> [`PRODUCT_BRIEF.md`](PRODUCT_BRIEF.md) prefers browser-local storage (e.g. `localStorage`) as the default for saving a favourite outfit, since it is inexpensive and avoids adding backend state. A server-side endpoint may not be needed at all — only add this if the team specifically decides local storage is insufficient.

### Request

```json
{
  "outfit_id": "outfit_001"
}
```

### Response

```json
{
  "favorite_id": "fav_001",
  "outfit_id": "outfit_001",
  "status": "saved"
}
```

## Error Response

```json
{
  "error": {
    "code": "GARMENT_NOT_DETECTED",
    "message": "I couldn't clearly identify a garment in this photo. Try a clearer photo with the item laid flat or worn in good lighting.",
    "recoverable": true
  }
}
```

Other example codes: `IMAGE_UNCLEAR`, `RECOMMENDATION_UNAVAILABLE`.

## Contract Rules

- Always return honest, user-facing uncertainty notes when confidence is low.
- Do not return hidden chain-of-thought.
- Add optional fields instead of breaking existing fields.
- Make `source_state` visible in every response that carries model output.
- Every outfit item must carry `ownership` — never omit or fake it.
- Never label a `suggested_item` in a way that implies the user already owns it.
