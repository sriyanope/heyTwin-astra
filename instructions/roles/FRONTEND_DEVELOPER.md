# Role: Frontend Developer

## Mission

Implement heyTwin's mobile-first upload-to-outfit UI and connect it to backend APIs: capture/upload, garment attribute confirmation, outfit cards, loading/error states, and whichever prioritised-addition refinements the team has time for. See [`PRODUCT_BRIEF.md`](../PRODUCT_BRIEF.md) for the essential flow this UI must complete end to end.

## Responsibilities

- Implement the capture/upload flow for one top or bottom.
- Build the garment attribute confirmation UI, including user corrections.
- Build the occasion selector and the outfit results board.
- Connect to backend endpoints for garment analysis, confirmation, and outfit recommendation.
- Display outfit cards with the your-item/suggested-item distinction visually unmistakable on every card.
- Handle loading, error, low-confidence, and fallback states.
- Ensure the UI is usable on an actual mobile browser, not just a desktop viewport.

## Main Components

- `CapturePanel`
- `GarmentConfirmCard`
- `OccasionSelector`
- `OutfitCard`
- `ItemOwnershipBadge`
- `ExplanationText`
- `ConfidenceNote`
- `RefinementControls` (prioritised addition)
- `FavoriteButton` (prioritised addition)

## API Endpoints To Consume

- `POST /api/analyze-garment`
- `POST /api/confirm-garment`
- `POST /api/recommend-outfits`
- `POST /api/refine-outfit` (prioritised addition)

Confirm exact route names and payload shapes against [`API_CONTRACTS.md`](../API_CONTRACTS.md) before wiring calls — that file is the source of truth for the contract, not this list.

## Frontend Rules

- Never expose the runtime vision/recommendation model's API key in frontend code.
- Keep all model calls backend-side; the frontend only talks to heyTwin's own API.
- Label the your-item/suggested-item distinction in every outfit view.
- Show `source_state` (e.g. sample/fallback) honestly whenever it is not live.
- Add accessible labels to interactive controls.
- Do not claim fit or body-type information in any rendered copy, including error or placeholder text.

## Required States

- Loading: e.g. "Looking at your item..."
- Success: identified attributes + outfit cards rendered.
- Low confidence: correction prompt shown before recommendations proceed.
- Error: simple, readable retry message — never a blank screen.
- Fallback: honest "showing a sample result" notice when live output isn't available.

## Definition of Done

- [ ] Capture/upload works
- [ ] Attribute confirmation with correction works
- [ ] At least one outfit renders
- [ ] Item-ownership label visible on every outfit
- [ ] Error and fallback states exist
- [ ] Accessible labels present on controls
- [ ] No secrets in frontend code
- [ ] Works on an actual mobile browser, not just desktop

## Dependencies / Handoffs

- Implements the UX/UI Designer's mockups and component guide.
- Consumes endpoints built by the Backend Developer, confirmed against the API Integration Engineer's provider integration work.
- Hands the built flow to the QA Tester for end-to-end testing.

## Scope Boundaries (Out of Scope for This Role)

- Does not own backend logic, validation, or the runtime model call — that is the Backend Developer's job.
- Does not choose or negotiate the runtime AI provider — that is the API Integration Engineer's job.
- Does not design the visual system from scratch — implements the UX/UI Designer's designs.
