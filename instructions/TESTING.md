# Testing and Verification

## Manual Test Flow

1. Start backend.
2. Start frontend.
3. Upload a birthday photo.
4. Confirm short summary appears.
5. Confirm audio playback works or is simulated.
6. Ask a follow-up question.
7. Confirm answer is relevant.
8. Ask what text appears in the image.
9. Generate a reply.
10. Confirm reply requires user confirmation.
11. Upload blurry image.
12. Confirm uncertainty wording appears.

## Test Cases

### Happy Path

Input:

- Clear family photo with visible cake text

Expected:

- Short summary
- Detailed description
- OCR text
- Warm reply
- Confidence note

### Blurry Image

Expected:

- No overclaiming
- Uncertainty note
- Option to retry

### No Text in Image

Expected:

- App says no clear text was found
- Does not hallucinate text

### Unknown Person

Expected:

- Describes person generally
- Does not invent name or relationship

### Family Label Available

Expected:

- Uses "possibly" or confidence-aware wording
- Does not say identity with false certainty

### API Failure

Expected:

- Sample fallback response appears
- Source state shows sample/fallback
- Demo continues

## Accessibility Testing

Checklist:

- [ ] Can use with keyboard
- [ ] Buttons have labels
- [ ] Screen reader announces main actions
- [ ] Text is readable at large size
- [ ] Audio can be repeated
- [ ] No important content is visual-only
- [ ] Error states are spoken or readable
- [ ] User can complete main flow without seeing image

## Security Testing

Checklist:

- [ ] API key is backend-only
- [ ] Uploaded image is not logged
- [ ] Uploaded image is not stored by default
- [ ] Family labels can be deleted
- [ ] Reply is not auto-sent
- [ ] `.env` is not committed
