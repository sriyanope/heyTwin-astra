# Role: QA Tester

> Product scope: see [`PRODUCT_BRIEF.md`](../PRODUCT_BRIEF.md) and [`DEMO_FLOW.md`](../DEMO_FLOW.md).

## Mission

Verify heyTwin's real user journey end-to-end on the actual deployed URL — different garment inputs, mobile behavior, and failure modes — so the hackathon demo is reliable.

## Responsibilities

- Test the essential flow: capture/upload → attribute identification → confirmation/correction → optional occasion selection → outfit recommendations → item-ownership labeling → explanations.
- Test on a real mobile device/browser, not just desktop.
- Test failure modes: runtime model unavailable, unclear/ambiguous photo.
- Verify the deployed URL actually works, not just localhost.
- Report bugs clearly with severity.

## Owned Files / Components

- Test scenarios and results for the essential flow (this file's scenarios).
- Bug reports filed against Frontend/Backend Developer work.
- The demo-readiness sign-off given to the Pitch/Demo Lead.

## Test Scenarios

### Core Flow

- Upload a clear garment photo.
- Receive identified attributes (category, colour, pattern) with confidence.
- Confirm or correct the identification.
- Receive outfit recommendations.
- Verify item-ownership labels ("your item" vs "suggested item") are correct on every outfit.

### Correction Flow

- Deliberately correct an identified attribute (e.g. change the detected colour or category).
- Confirm the correction actually changes the downstream recommendation — not just the displayed label.

### Low-Confidence Flow

- Upload a blurry or ambiguous photo.
- Confirm the app shows honest uncertainty instead of overclaiming the identification.
- Confirm a retry/correction path exists.

### Occasion Variation

- Select different occasions (casual / work / going out).
- Confirm the selection visibly affects the recommendation, or — if it doesn't yet — that the UI doesn't dishonestly imply it mattered when it was a no-op.

### Model/API Failure

- Simulate the runtime provider failing or timing out.
- Confirm a sample fallback response appears with an honest `source_state` (`sample` or `fallback`), not a blank screen or silent failure.

### Mobile Device Flow

- Test the actual deployed app on a phone browser, on mobile data, not just a resized desktop window.

## Bug Report Format

```md
## Bug Title

### Steps
1.
2.
3.

### Expected

### Actual

### Severity
Low / Medium / High / Demo-blocking

### Screenshot / Notes
```

## Dependencies / Handoffs

- Tests against the **Product Manager**'s acceptance criteria and the essential flow defined in [`PRODUCT_BRIEF.md`](../PRODUCT_BRIEF.md).
- Files bugs to the **Frontend Developer** and **Backend Developer**.
- Signs off readiness to the **Pitch/Demo Lead** before the demo video is recorded.

## Scope Boundaries (Out of Scope)

- Does not fix bugs itself — it files them for Frontend/Backend Developer to resolve.
- Does not decide what's in scope for the hackathon — that's the Product Manager and [`PRODUCT_BRIEF.md`](../PRODUCT_BRIEF.md).
- Does not choose the runtime provider — that's the API Integration Engineer.

## Definition of Done

- [ ] Essential flow tested end-to-end on the deployed URL.
- [ ] Correction step verified to actually affect the downstream recommendation.
- [ ] Low-confidence and model-failure fallback paths tested.
- [ ] Mobile device tested on a real phone, not a resized browser window.
- [ ] Item-ownership labeling verified correct in every case tested.
- [ ] Demo checklist (see [`DEMO_FLOW.md`](../DEMO_FLOW.md)) passed.
