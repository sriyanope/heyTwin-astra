# Frontend Guide

## Framework

Recommended frontend: **Next.js App Router** or **React**.

## Main UI Surface

The primary interface is a **voice-first photo description workspace**.

The app should not feel like a normal image gallery or chatbot. It should feel like a simple accessibility companion.

## Main Screens

### 1. Home / Upload Screen

Elements:

- Large title
- Large "Describe Photo" button
- Upload image button
- Optional "Use Demo Photo" button
- Accessibility settings shortcut

### 2. Description Screen

Elements:

- Short summary
- Play / pause / repeat controls
- "Tell me more" button
- "Ask a question" button
- "Read text in image" shortcut
- Confidence/uncertainty note

### 3. Follow-Up Screen

Elements:

- Voice question button
- Text question fallback
- Answer transcript
- Repeat answer button

### 4. Reply Draft Screen

Elements:

- Suggested reply
- Copy button
- Make warmer
- Make shorter
- Regenerate
- Cancel

### 5. Family Setup Screen

Elements:

- Add family member label
- Relationship field
- Consent checkbox
- Delete saved labels

## Accessibility Rules

- Large touch targets
- High contrast
- Screen-reader friendly labels
- No hover-only interactions
- No small icon-only buttons
- Keyboard navigable
- Voice output available
- Text transcript always available
- Slow speech option
- Repeat button always visible

## Environment Variables

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

Do not place private Agnes API keys in frontend code.

## Data Fetching

Use standard `fetch()` for:

- `/api/analyze-image`
- `/api/ask-image`
- `/api/generate-reply`
- `/api/family-labels`

## Required UI States

Every async flow should handle:

- Loading
- Empty result
- Partial result
- Success
- Low confidence
- Error
- Sample fallback

## Component Structure

Recommended:

```text
frontend/
  app/
    page.tsx
    describe/
    settings/
  components/
    UploadPanel.tsx
    AudioControls.tsx
    SummaryCard.tsx
    DetailCard.tsx
    QuestionPanel.tsx
    ReplyDraftCard.tsx
    PrivacyNotice.tsx
    ConfidenceNote.tsx
  lib/
    api.ts
    speech.ts
    types.ts
```

## Do Not Add Unless Approved

- Complex 3D visualizations
- Heavy animation libraries
- Social media posting automation
- Automatic WhatsApp sending
- Unconsented face recognition
- Overly complex dashboard UI
