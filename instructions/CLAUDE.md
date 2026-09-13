# CLAUDE.md

This file is the source of truth for **FamLens**.

## Product Summary

FamLens is an AI-powered accessibility companion that helps visually impaired elderly users understand and respond to family photos.

The product should help users feel:

- Included
- Calm
- Respected
- In control
- Connected to family moments

The product should not feel:

- Clinical
- Overly technical
- Like a surveillance tool
- Like a generic chatbot
- Like a tool that guesses with false certainty

## Main Demo Flow

1. User receives a family photo from WhatsApp.
2. User uploads or shares the image into FamLens.
3. FamLens analyses the image.
4. FamLens speaks a short summary.
5. User taps or says "Tell me more."
6. FamLens gives a richer description.
7. User asks, "What does the text say?" or "Who is smiling?"
8. FamLens answers with uncertainty-aware language.
9. App asks, "Would you like help replying?"
10. FamLens drafts a warm message.

## AI Pipeline

### Stage 1: Image Intake

Goal: Accept a family photo or WhatsApp-style image.

Input:

```json
{
  "image": "file or base64 reference",
  "user_preferences": {
    "language": "English",
    "detail_level": "short",
    "speech_speed": "slow"
  }
}
```

Output:

```json
{
  "image_id": "string",
  "status": "accepted"
}
```

### Stage 2: Scene Understanding

Goal: Identify the main visible content.

Output should include:

```json
{
  "scene_summary": "A short plain-language description.",
  "objects": [],
  "people_count": 0,
  "setting": "indoor | outdoor | unknown",
  "confidence": 0.0
}
```

### Stage 3: OCR Text Reading

Goal: Read text visible in the image.

Examples:

- Birthday cake text
- Greeting card text
- Signboards
- WhatsApp screenshot text
- Travel or event captions

Output:

```json
{
  "detected_text": [],
  "ocr_confidence": 0.0,
  "text_uncertainty_note": "Some text may be blurry."
}
```

### Stage 4: Family Context

Goal: Use opt-in family labels if available.

Rules:

- Never identify people with certainty unless explicitly labeled and confidence is high.
- Use phrases like "possibly your grandson Ethan" when uncertain.
- Let users delete labels.
- Store labels only with consent.

Output:

```json
{
  "possible_family_matches": [
    {
      "name": "Ethan",
      "relationship": "grandson",
      "confidence": 0.78,
      "wording": "This may be your grandson Ethan."
    }
  ]
}
```

### Stage 5: Elder-Friendly Summary

Goal: Generate a short spoken summary first.

Example:

> "This looks like a happy birthday photo. A child is smiling beside a cake. The cake appears to say Happy Birthday Ethan."

Rules:

- Use simple language.
- Keep first summary short.
- Avoid overwhelming detail.
- Mention uncertainty clearly.

### Stage 6: Detailed Description

Goal: Provide more detail only when requested.

Should describe:

- People
- Actions
- Setting
- Objects
- Text
- Mood
- Important uncertainty

### Stage 7: Follow-Up Q&A

Goal: Answer user questions about the image.

Example questions:

- "Who is in the photo?"
- "What are they doing?"
- "Is my granddaughter smiling?"
- "What does the text say?"
- "Where was this taken?"
- "Can you describe it more emotionally?"

Rules:

- Answer only from visible image evidence and saved family context.
- Do not hallucinate.
- Say when the image does not show enough information.

### Stage 8: Reply Generation

Goal: Help the user participate in the family conversation.

Example:

> "Looks like such a happy birthday celebration. I’m so glad to see everyone smiling. Send my love to Ethan."

Rules:

- Keep replies warm, short, and natural.
- Let user confirm before sending or copying.
- Do not auto-send messages without confirmation.

## API Events / Status Updates

User-facing status examples:

- "I am looking at the photo now."
- "I found some text in the image."
- "I am checking whether this matches your saved family labels."
- "I am preparing a short description."
- "I am not fully sure who one person is, so I will describe them carefully."

## Source / Confidence Rules

Every AI output should include:

```json
{
  "confidence": 0.0,
  "uncertainty_note": "string",
  "source_state": "live | cache | sample | fallback"
}
```

Rules:

- Be honest about uncertainty.
- Show fallback/sample state in demo if used.
- Do not pretend mock data is live.
- Do not fabricate identity, location, or relationships.

## Privacy Rules

- Do not store uploaded photos by default.
- Delete temporary files after processing where possible.
- Family labels must be opt-in.
- Allow users to delete family labels.
- Do not train models on user photos.
- Do not send replies automatically.
- Do not expose private image data in logs.

## Demo Guardrails

The demo should use safe, consented, sample images.

Show three cases:

1. Clear family birthday photo
2. WhatsApp image with text
3. Ambiguous/blurry image to demonstrate uncertainty

## Verification Checklist

- [ ] Image upload works.
- [ ] Short summary is generated.
- [ ] Text-to-speech works or is simulated.
- [ ] Detailed description works.
- [ ] OCR text is shown/read.
- [ ] Follow-up Q&A works.
- [ ] Reply draft is generated.
- [ ] Uncertainty language appears.
- [ ] No hidden chain-of-thought is shown.
- [ ] No secrets are committed.
