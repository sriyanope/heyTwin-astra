# Accessibility, Privacy, and Safety

> Product scope lives in [`PRODUCT_BRIEF.md`](PRODUCT_BRIEF.md). This document covers accessibility good practice and privacy/safety requirements for heyTwin.

## Accessibility Principles

heyTwin is a mobile-first visual styling app for general fashion shoppers, not an accessibility-first product for a specific access need. Accessibility here is **ordinary inclusive-design good practice** — contrast, labels, alt text, keyboard use — applied because it makes the product better for everyone, not because it is the product's defining identity.

## UX Requirements

The interface should be:

- Simple and mobile-first
- High contrast
- Screen-reader compatible
- Reasonably sized touch targets
- Low cognitive load (short explanations, minimal jargon)
- Forgiving of mistakes (easy to correct a wrong attribute, easy to retry a failed request)

## Required Accessibility Features

- Readable contrast between text and background
- Legible text size across all screens
- Clear labels on all interactive controls: upload/capture button, confirm/correct controls, occasion selector, outfit cards, refinement and favorite buttons
- Keyboard operability where relevant to a mobile web app (visible focus states, sensible tab order)
- Useful alt text / image descriptions for garment and outfit images — an outfit board full of images needs meaningful descriptions for screen-reader users (e.g. "Your item: navy floral top" / "Suggested item: beige tailored trousers")
- Accessible status, loading, and error messages that are exposed to screen readers, not conveyed by visual styling alone

## Plain-Language Uncertainty Wording

Use plain, jargon-free language for confidence and uncertainty, appropriate for any user — not just an accessibility-specific audience.

Use:

- Short sentences
- Clear uncertainty wording
- No technical jargon

Avoid:

- "Confidence score: 0.62"
- "Model inference uncertain"
- "Classification failed"

Better:

> "I'm not fully sure about the pattern on this piece — you can correct it below."

## Privacy Principles

Garment photos are personal, but they are not as sensitive as family or child photos. The privacy bar is still meaningful: minimize retention by default, be honest about what happens to an uploaded photo, and protect backend secrets.

## Privacy Requirements

- Do not store uploaded garment photos longer than needed for processing.
- Do not train models on user photos without clearly saying so.
- Protect backend secrets — API keys for the vision/recommendation provider (provider is unverified/TBD) must never be exposed in frontend code, client bundles, or logs.
- Do not expose image contents in logs.
- Any privacy note shown to the user must describe image handling accurately — do not claim images are deleted if they aren't, and do not claim more privacy protection than is actually implemented.

## Body/Fit Honesty

- Never claim to infer body type from a garment photo.
- Never claim a suggested outfit "fits" the user.
- Only describe visible garment attributes (category, colour, pattern, etc.) and styling compatibility between pieces — never physical fit.

## Recommendation Honesty

- Every outfit view must visually and textually distinguish **"Your item"** (what the user actually uploaded) from **"Suggested item"** (a complementary piece they may or may not own).
- Never imply a suggested item is already in the user's wardrobe.
- Do not fabricate product availability or purchase links.
- Any sample, cached, or fallback content shown in a demo must be labeled honestly, never presented as live.

## Safety Checklist

- [ ] No default long-term photo storage
- [ ] No fabricated purchase links or availability claims
- [ ] Uncertainty wording appears for low-confidence attribute identification
- [ ] "Your item" vs "Suggested item" distinction is always visible
- [ ] No body-type or fit-inference claims anywhere in copy or UI
- [ ] Works reasonably with a screen reader
- [ ] Main flow is usable without relying on visual-only cues
