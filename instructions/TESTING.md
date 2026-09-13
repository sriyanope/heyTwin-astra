# Testing and Verification

> Product scope: see [`PRODUCT_BRIEF.md`](PRODUCT_BRIEF.md). This document is a forward-looking test plan — it describes what should be checked, not a report of testing that has already happened.

## Manual Test Flow

1. Start backend.
2. Start frontend.
3. Upload or capture a garment photo (one top or bottom).
4. Confirm identified attributes appear (category, colour, pattern, with confidence).
5. Deliberately correct an attribute to confirm the correction step actually works (not just displayed).
6. Optionally select an occasion (casual / work / going out).
7. Confirm outfit recommendations appear — target 3, at least 1 required.
8. Confirm the user's own item is visually distinguishable from suggested items in every outfit shown.
9. Confirm each outfit has a short explanation.
10. Upload a blurry or ambiguous garment photo and confirm uncertainty wording appears instead of overclaiming.
11. Simulate the runtime model being unavailable and confirm a sample fallback appears with an honest `source_state`.

## Test Cases

### Happy Path

Input:

- A clear garment photo (unambiguous colour, category, pattern)

Expected:

- Attributes are identified with reasonable confidence
- User can confirm or correct attributes
- Outfit recommendations are generated
- The user's item is clearly labeled as such in every outfit, distinct from suggested items
- Each outfit carries a short explanation

### Blurry / Ambiguous Image

Expected:

- Uncertainty note appears
- No overclaiming of attributes the model isn't confident about
- Retry option is available
- User can still proceed via manual correction

### Unusual Garment

Expected:

- App describes visible attributes generally
- Does not invent a category, pattern, or material it cannot actually see

### Occasion Selector Variation

Expected (best-effort — not a strict correctness bar for a hackathon prototype):

- Recommendations plausibly differ, or are at least contextualized, across occasion choices

### Model / API Failure

Expected:

- Sample fallback response appears
- `source_state` shows `sample` or `fallback`
- Demo continues without pretending the fallback is live

### Mobile Device Check

Expected:

- The flow is usable on an actual phone browser (not just a resized desktop viewport)

## Accessibility Testing

Checklist:

- [ ] Keyboard operable where relevant
- [ ] Buttons have labels
- [ ] Screen reader announces main state changes
- [ ] Text is legible
- [ ] Garment and outfit images have useful descriptions
- [ ] Error states are readable

## Security Testing

Checklist:

- [ ] API key is backend-only
- [ ] Uploaded image is not logged
- [ ] Uploaded image is not stored by default
- [ ] `.env` is not committed
- [ ] No fabricated purchase link or availability claim appears in any response
