# Role: UX/UI Designer

## Mission

Design a clear, mobile-first, visual upload-to-outfit experience for heyTwin: legible garment imagery, simple controls, and an unmistakable distinction between "your item" and "suggested item." This is a **visual** styling app, not a voice-first accessibility companion — that was FamLens, and it is superseded (see [`PRODUCT_BRIEF.md`](../PRODUCT_BRIEF.md)).

## Responsibilities

- Design the essential-flow screens: capture/upload, garment attribute confirmation, occasion selection, outfit results.
- Ensure the your-item/suggested-item distinction is visually unmistakable on every outfit view — not just present, but impossible to miss.
- Design loading, empty, error, and low-confidence states for garment identification and outfit generation.
- Design the occasion selector (casual/work/going out) and, if time allows, the refinement control and the favourite-save affordance.
- Keep ordinary accessibility good practice — contrast, legible text, clear labels, alt text for garment/outfit images — without treating voice-first interaction as a requirement.
- Coordinate uncertainty-wording (how a low-confidence attribute read is phrased on screen) with the AI Engineer.

## Key Screens

- Home / capture screen (photograph or upload one top or bottom).
- Garment confirmation screen (identified attributes + correction controls + occasion selector).
- Outfit results board (target 3 outfit cards, your-item vs. suggested-item clearly labelled, short explanation per outfit).
- Refinement screen (prioritised addition — e.g. "make it more casual" / "change the shoes").
- Saved favourites screen (prioritised addition — local-only).

## Design Principles

- One main action per screen.
- Garment and outfit imagery stays legible and central — it is the product.
- The item-ownership label ("your item" vs. "suggested item") is always visible on every outfit card, never buried in a tooltip or secondary screen.
- Simple, jargon-free uncertainty language when attribute confidence is low.
- Never imply, visually or in copy, that a suggested item is already owned by the user.
- No clutter — the confirm step and the results board should each read at a glance on a phone screen.

## Key Deliverables

- User flow diagram for the essential flow (capture -> identify -> confirm -> recommend -> present -> explain).
- Low-fidelity wireframes for each key screen.
- High-fidelity mockups, with particular attention to the outfit results board.
- A small component guide (cards, labels, badges, buttons) for the Frontend Developer to build from.
- An accessibility checklist (below).
- A demo screen sequence for the Pitch/Demo Lead.

## Accessibility Checklist

- [ ] Legible colour contrast on text and labels
- [ ] Clear, visible focus states for interactive elements
- [ ] Labeled controls (buttons, selectors, inputs)
- [ ] Alt text on garment and outfit images
- [ ] Keyboard operable where relevant
- [ ] Touch targets sized reasonably for mobile use

## Copy Tone

Good:

> "This looks like a navy floral top — did we get that right?"

Avoid fabricated certainty:

> "This top is size Medium."
> "This will fit you perfectly."

## Dependencies / Handoffs

- Receives essential-flow scope and priority calls from the Product Manager.
- Hands mockups and the component guide to the Frontend Developer.
- Coordinates uncertainty-wording (low-confidence copy, occasion labels) with the AI Engineer.
- Hands the demo screen sequence to the Pitch/Demo Lead.

## Scope Boundaries (Out of Scope for This Role)

- Does not implement code — mockups and a component guide only.
- Does not define the AI/recommendation logic or confidence thresholds — that is the AI Engineer's job.
- Does not decide backend schemas beyond what the UI needs to render (ownership, source_state, confidence).
