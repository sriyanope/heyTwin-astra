# Demo Flow

> Product scope: see [`PRODUCT_BRIEF.md`](PRODUCT_BRIEF.md). This is a forward-looking demo script — it describes the plan for the demo, not a report of a demo that has already been run.

## Demo Goal

Show that heyTwin turns one photographed garment into a confident, explained, wearable outfit — and that this actually worked live during the hackathon, on the deployed app.

The demo should show the deployed app's real runtime behavior: capture a garment, identify its attributes, confirm/correct them, and generate outfit recommendations that clearly distinguish the user's item from suggested items, each with a short explanation.

Separately, the demo/pitch can mention how **GPT Astra** was used during **development** (per [`HACKATHON_POSITIONING.md`](HACKATHON_POSITIONING.md)). Astra is the development platform used to build heyTwin — it is not necessarily the runtime vision/recommendation service the deployed app calls at inference time, and the two should not be conflated when explaining "how AI was used."

## Demo Setup

Use 3 safe sample garment photos:

1. A plain top with a clear, unambiguous colour.
2. A patterned bottom (e.g. plaid, floral, or striped).
3. A poor-lighting or otherwise ambiguous item, to show honest uncertainty handling.

## Scene 1: Problem

Narration:

> A well-liked piece of clothing sits unused in the wardrobe because the person doesn't know what to pair it with.

## Scene 2: Capture / Upload

User opens heyTwin and photographs or uploads a garment.

The app shows:

- Image selected
- Processing started

## Scene 3: Attribute Identification + Confirmation

heyTwin identifies the garment's visible attributes (category, colour, pattern) with confidence.

The user deliberately corrects one attribute to prove the confirmation step is real, not scripted.

## Scene 4: Occasion Selection (Optional)

User selects an occasion: casual, work, or going out.

## Scene 5: Outfit Recommendations

heyTwin presents outfit recommendations built around the confirmed garment.

Each outfit visually distinguishes:

- **Your item** — the garment the user supplied
- **Suggested item** — a complementary piece the user may not own

## Scene 6: Explanation

Read aloud the explanation text for at least one outfit — a short, plain-language reason the combination works.

## Scene 7: Refinement (If Built)

If the refinement action was built in time: apply one refinement (e.g. "make it more casual" or "change the shoes") and show the updated recommendation.

This is a prioritised addition, not part of the essential flow — skip this scene if it wasn't built.

## Scene 8: Ambiguous Image

Upload the poor-lighting/ambiguous sample garment photo.

heyTwin shows uncertainty wording instead of overclaiming the identified attributes, matching the reliability story: the app is honest about what it isn't sure of.

## Closing Line

> heyTwin helps someone rediscover a wearable combination for a piece of clothing they'd stopped using.

## Backup Plan

If the live runtime model call fails:

- Use a cached sample response.
- Show `source_state` as `sample` or `fallback`, labeled honestly in the UI.
- Continue the demo without pretending the fallback output is live.

## Demo Checklist

- [ ] Capture/upload works.
- [ ] Attribute identification appears.
- [ ] Correction step works.
- [ ] At least one outfit recommendation renders.
- [ ] Item-ownership labeling ("your item" vs "suggested item") is visually clear.
- [ ] Explanation text appears.
- [ ] Uncertainty example works on a poor photo.
- [ ] Demo runs on the actual deployed URL, not just localhost.
- [ ] Video is exactly 90 seconds and viewable signed-out (no access request required).
