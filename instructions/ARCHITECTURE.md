# Architecture

## System Overview

FamLens consists of:

- Frontend app for image upload, voice interaction, and accessible UI
- Backend API for image processing and AI orchestration
- Agnes AI API integration for multimodal reasoning and generation
- Optional local/cache storage for demo fallback
- Optional family label store for relationship-aware descriptions

## High-Level Flow

```text
Image input
  -> Frontend validation
  -> Backend upload endpoint
  -> Agnes AI image analysis
  -> OCR extraction
  -> Family context lookup
  -> Summary generation
  -> Follow-up Q&A
  -> Reply generation
  -> Voice output
```

## Repository Structure

```text
famlens/
  frontend/
    app/
    components/
      upload/
      audio/
      summary/
      questions/
      reply/
      accessibility/
    lib/
      api.ts
      types.ts
      speech.ts
  backend/
    api/
      routes/
    services/
      agnes/
      ocr/
      family_context/
      privacy/
    models/
    tests/
  data/
    sample_images/
    sample_responses/
  docs/
  README.md
  AGENTS.md
  CLAUDE.md
```

## Frontend Responsibilities

- Let user upload or share an image
- Show accessible progress updates
- Display short and detailed descriptions
- Play text-to-speech audio
- Accept voice or typed follow-up questions
- Show reply drafts
- Make uncertainty and confidence visible
- Support high contrast and screen-reader usage

## Backend Responsibilities

- Validate image input
- Send image to Agnes AI API
- Normalize AI output into stable contracts
- Run OCR or request OCR from AI model
- Apply opt-in family context
- Generate short summary, detailed description, and replies
- Return confidence and uncertainty notes
- Avoid storing photos by default
- Support sample fallback for demo reliability

## Agent Responsibilities

- Interpret image content
- Read visible text
- Summarize in elder-friendly language
- Answer follow-up questions
- Draft warm replies
- Communicate uncertainty
- Avoid hallucinating names, relationships, locations, or intentions

## Data Entities

### ImageAnalysis

```json
{
  "image_id": "string",
  "short_summary": "string",
  "detailed_description": "string",
  "detected_text": [],
  "people_count": 0,
  "mood": "string",
  "confidence": 0.0,
  "uncertainty_note": "string",
  "source_state": "live"
}
```

### FamilyLabel

```json
{
  "person_id": "string",
  "name": "string",
  "relationship": "string",
  "consent_confirmed": true,
  "created_at": "string"
}
```

### ReplyDraft

```json
{
  "reply": "string",
  "tone": "warm",
  "length": "short"
}
```

## External Integrations

| Service | Purpose | Mode |
|---|---|---|
| Agnes AI API | Multimodal image analysis and generation | Live |
| Browser Speech API | Text-to-speech demo | Local/browser |
| WhatsApp | Share workflow inspiration | Simulated for MVP |
| Local sample data | Demo fallback | Mock |

## Reliability Strategy

- Use sample images and sample responses for backup.
- Keep response schemas stable.
- Show fallback state honestly.
- Do not block the whole app if OCR fails.
- Let the user retry or ask simpler questions.
