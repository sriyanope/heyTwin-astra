# Backend Guide

## Framework

Recommended backend: **FastAPI** or **Express**.

## Responsibilities

The backend is responsible for:

- Image upload handling
- Image validation
- Agnes AI API integration
- AI response normalization
- OCR extraction
- Optional family context lookup
- Follow-up Q&A
- Reply generation
- Privacy-safe temporary processing
- Demo fallback responses

## Core Endpoints

| Endpoint | Method | Purpose |
|---|---:|---|
| `/health` | GET | Health check |
| `/api/analyze-image` | POST | Analyse uploaded image |
| `/api/ask-image` | POST | Ask follow-up question |
| `/api/generate-reply` | POST | Generate family reply |
| `/api/family-labels` | POST | Save opt-in family label |
| `/api/family-labels/{id}` | DELETE | Delete family label |

## AI Orchestration

```text
Validate image
  -> Send image to Agnes AI
  -> Request scene analysis
  -> Request OCR/text extraction
  -> Apply family context if enabled
  -> Generate short summary
  -> Generate detailed description
  -> Return structured response
```

## Agnes AI Integration

Use Agnes AI as the multimodal intelligence layer.

The integration should support:

- Image understanding
- Text extraction
- Summary generation
- Conversational follow-up
- Reply drafting

Do not hardcode AI outputs except as demo fallback.

## Privacy Rules

- Do not store uploaded images by default.
- Delete temporary images after processing where possible.
- Do not log base64 images.
- Do not log private family labels unnecessarily.
- Store family labels only after consent.
- Provide delete functionality for saved labels.

## Error Handling

Return user-facing errors:

```json
{
  "error": {
    "code": "LOW_CONFIDENCE_IMAGE",
    "message": "I could not clearly understand this photo. You can try another image or ask a simpler question.",
    "recoverable": true
  }
}
```

## Fallback Strategy

If Agnes AI API is unavailable:

- Use committed sample responses for demo.
- Return `source_state: "sample"`.
- Show fallback state in frontend.
- Do not pretend fallback data is live.

## Security

- Store Agnes API key in backend `.env`.
- Never expose API key to frontend.
- Validate file type and file size.
- Reject unsafe uploads.
- Sanitize text outputs.
