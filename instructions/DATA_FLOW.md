# Data Flow

## Overview

This document describes how data moves through FamLens.

```text
User image
  -> Frontend upload
  -> Backend image validation
  -> Agnes AI analysis
  -> OCR extraction
  -> Optional family context lookup
  -> Summary generation
  -> Voice output
  -> Follow-up Q&A
  -> Reply generation
```

## Input Data

User provides:

- Image file
- Optional language preference
- Optional detail level
- Optional speech speed
- Optional family labels

Example:

```json
{
  "image": "birthday_photo.jpg",
  "language": "English",
  "detail_level": "short",
  "speech_speed": "slow"
}
```

## Processing Stages

| Stage | Input | Output | Notes |
|---|---|---|---|
| Intake | Image | Validated image reference | Reject unsupported files |
| Scene Analysis | Image | Objects, people count, setting, mood | Uses Agnes AI |
| OCR | Image | Visible text | May be uncertain if blurry |
| Family Context | Analysis + saved labels | Possible family matches | Opt-in only |
| Summary | Analysis | Short elder-friendly description | Spoken first |
| Detailed Mode | Analysis | Richer description | On request |
| Q&A | Image + question | Answer | No hallucination |
| Reply | Summary + context | Reply draft | Requires confirmation |

## Source State

Use source states:

- `live`: Generated from live AI request
- `cache`: Retrieved from cached response
- `sample`: Demo sample response
- `fallback`: Generated after failure or limited input

Example:

```json
{
  "source_state": "sample",
  "source_label": "Demo fallback response",
  "confidence": 0.75
}
```

## Confidence Rules

Confidence should be used for:

- Person identity
- OCR text
- Scene interpretation
- Emotional interpretation

Example:

```json
{
  "confidence": 0.62,
  "uncertainty_note": "The image is blurry, so I may not identify the person correctly."
}
```

## Privacy Flow

Default:

```text
Upload image
  -> Process temporarily
  -> Return description
  -> Delete image after processing
```

Optional family labels:

```text
User/caregiver labels person
  -> Consent confirmed
  -> Store label reference securely
  -> Use in future descriptions
  -> Allow delete anytime
```

## Frontend Rendering Rules

- Show short description first.
- Do not overwhelm the user with all details immediately.
- Always allow repeat audio.
- Always show transcript.
- Show uncertainty in plain language.
- Show whether output is sample/fallback.
- Preserve user control before replies.
