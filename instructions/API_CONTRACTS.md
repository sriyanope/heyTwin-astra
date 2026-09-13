# API Contracts

## Base URL

Local backend:

```text
http://localhost:8000
```

Frontend should read:

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

## Common Types

```ts
type SourceState = "live" | "cache" | "sample" | "fallback";

type ConfidenceLevel = "high" | "medium" | "low";

type Uncertainty = {
  level: ConfidenceLevel;
  note: string;
};

type DetectedText = {
  text: string;
  confidence: number;
};

type FamilyMatch = {
  name: string;
  relationship: string;
  confidence: number;
  wording: string;
};
```

## POST /api/analyze-image

Purpose: Analyse an uploaded family image.

### Request

```json
{
  "image": "file-reference-or-base64",
  "preferences": {
    "language": "English",
    "detail_level": "short",
    "speech_speed": "slow"
  }
}
```

### Response

```json
{
  "image_id": "img_001",
  "short_summary": "This looks like a birthday celebration...",
  "detailed_description": "There are several people indoors...",
  "detected_text": [
    {
      "text": "Happy Birthday Ethan",
      "confidence": 0.82
    }
  ],
  "people_count": 3,
  "mood": "happy and warm",
  "family_matches": [],
  "confidence": 0.86,
  "uncertainty": {
    "level": "medium",
    "note": "The text is slightly blurry."
  },
  "source_state": "live"
}
```

## POST /api/ask-image

Purpose: Ask a follow-up question about the analysed image.

### Request

```json
{
  "image_id": "img_001",
  "question": "What does the cake say?",
  "conversation_history": []
}
```

### Response

```json
{
  "answer": "The cake appears to say Happy Birthday Ethan.",
  "confidence": 0.82,
  "uncertainty": {
    "level": "medium",
    "note": "The text is partly small."
  },
  "source_state": "live"
}
```

## POST /api/generate-reply

Purpose: Generate a warm reply to send back to family.

### Request

```json
{
  "image_id": "img_001",
  "tone": "warm",
  "length": "short",
  "context": "Birthday photo from family"
}
```

### Response

```json
{
  "reply": "Looks like such a happy birthday celebration. I’m so happy to see everyone smiling. Send my love to Ethan.",
  "alternatives": [
    "So lovely to see this. Happy birthday to Ethan!"
  ],
  "requires_confirmation": true
}
```

## POST /api/family-labels

Purpose: Add an opt-in family label.

### Request

```json
{
  "name": "Ethan",
  "relationship": "grandson",
  "consent_confirmed": true,
  "reference_image_id": "img_001"
}
```

### Response

```json
{
  "person_id": "person_001",
  "status": "saved",
  "message": "Family label saved. You can delete this anytime."
}
```

## DELETE /api/family-labels/{person_id}

Purpose: Delete a saved family label.

### Response

```json
{
  "status": "deleted"
}
```

## Error Response

```json
{
  "error": {
    "code": "IMAGE_TOO_BLURRY",
    "message": "I could not clearly understand this image. You can try another photo or ask a simpler question.",
    "recoverable": true
  }
}
```

## Contract Rules

- Always return user-facing uncertainty notes when confidence is low.
- Do not return hidden chain-of-thought.
- Add optional fields instead of breaking existing fields.
- Make source state visible.
- Keep `requires_confirmation` true for reply actions.
