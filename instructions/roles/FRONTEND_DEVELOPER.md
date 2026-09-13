# Role: Frontend Developer

## Mission

Build the accessible user interface for FamLens and connect it to backend APIs.

## Responsibilities

- Implement upload/share image flow
- Build accessible UI components
- Connect to backend endpoints
- Implement text-to-speech playback
- Display summary, OCR, Q&A, and reply results
- Handle loading, error, empty, and fallback states
- Ensure responsive and screen-reader-friendly UI

## Main Components

- `UploadPanel`
- `AudioControls`
- `SummaryCard`
- `DetailCard`
- `QuestionPanel`
- `ReplyDraftCard`
- `ConfidenceNote`
- `PrivacyNotice`
- `FamilyLabelForm`

## API Endpoints To Consume

- `POST /api/analyze-image`
- `POST /api/ask-image`
- `POST /api/generate-reply`
- `POST /api/family-labels`
- `DELETE /api/family-labels/{id}`

## Frontend Rules

- Do not expose Agnes API key.
- Use `NEXT_PUBLIC_BACKEND_URL`.
- Keep all private calls backend-side.
- Add accessible labels to buttons.
- Show transcript for all spoken output.
- Do not rely only on visual indicators.
- Show fallback/source state clearly.

## Required States

- Loading: "I am looking at the photo now."
- Success: summary and audio controls
- Low confidence: uncertainty note
- Error: simple retry message
- Fallback: "Using demo fallback response."

## Definition of Done

- [ ] Upload works
- [ ] Summary renders
- [ ] Audio playback works or is simulated
- [ ] Q&A flow works
- [ ] Reply draft renders
- [ ] Error states exist
- [ ] Screen reader labels added
- [ ] No secrets in frontend
