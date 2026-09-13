# Agent Instructions

This project is **heyTwin** (formerly referred to as *TFR / The Fitting Room*).

## Current Product Direction

heyTwin is a mobile-first AI styling app. The user photographs one top or bottom they already own. The app identifies the garment's visible attributes, the user confirms or corrects them, and the app returns visual outfit recommendations built around that specific garment — each with a short, plain-language explanation of why it works.

The product is not a wardrobe manager, not a virtual try-on tool, and not a fit/sizing predictor.

The main product flow is:

1. User captures or uploads a photo of one top or bottom.
2. Backend/AI pipeline identifies visible garment attributes (category, colour, pattern, and other confidently visible attributes).
3. User confirms or corrects the identified attributes.
4. User optionally picks an occasion (casual / work / going out).
5. AI generates outfit recommendations built around the user's garment.
6. App presents the outfits visually, clearly distinguishing "your item" from "suggested items."
7. App gives a short explanation of why each combination works.

## Source of Truth

Use these files as source of truth:

- [`PRODUCT_BRIEF.md`](PRODUCT_BRIEF.md) — canonical scope: problem, users, essential flow, prioritised additions, exclusions, and product honesty rules. If any document disagrees with `PRODUCT_BRIEF.md` about what we are building, `PRODUCT_BRIEF.md` wins.
- `CLAUDE.md` for the AI pipeline, backend contracts, and demo guardrails.
- `ACCESSIBILITY_PRIVACY.md` for privacy, consent, and safety rules.
- `README.md` for implemented features and setup.
- Existing code for current conventions.

If documents conflict, prefer this order:

1. This `AGENTS.md`
2. [`PRODUCT_BRIEF.md`](PRODUCT_BRIEF.md)
3. `CLAUDE.md`
4. `ACCESSIBILITY_PRIVACY.md`
5. `README.md`
6. Existing code

## Hackathon Positioning

The differentiator is not **"we built an app that shows outfits."**

The differentiator is turning **one lonely, underused garment** into a confident, visually presented, explained outfit — with the user's own item kept visually central and clearly distinguished from what is merely suggested.

Two roles must not be confused:

- **Astra (GPT Astra)** is the AI development platform/coding assistant the team uses to *build* heyTwin during the hackathon. It is not part of the deployed app's runtime.
- The **runtime vision/styling model provider is TBD / unverified.** Do not name a specific vendor or model anywhere in product copy, pitch materials, or code comments until the API Integration Engineer confirms it (see [`DECISIONS.md`](DECISIONS.md) ADR-004). Refer to it generically as "the vision/styling model provider (TBD)."

heyTwin should show AI doing essential, visible work across:

- Garment attribute identification
- User-correctable confirmation
- Outfit recommendation generation
- Plain-language explanation of each recommendation

Do not expose hidden chain-of-thought. Show user-facing rationale, confidence, and the final recommendation only.

## Non-Negotiables

- Do not infer body type from a garment photo.
- Do not claim a styling suggestion establishes physical fit. heyTwin suggests what goes together; it says nothing about what will fit.
- Always distinguish **"Your item"** (what the user uploaded) from **"Suggested item"** (a complementary piece the user may not own). Never imply suggested items come from the user's wardrobe.
- Do not invent purchase links, product availability, retailer integration, or AI vendor/model capabilities that have not been verified.
- Label any sample/cached/fallback demo output honestly (`source_state`). Never present sample data as live.
- Do not commit secrets, API keys, tokens, or private credentials.
- Keep demo reliability ahead of visual polish and ahead of extra outfit count — one reliable end-to-end result beats three unreliable ones.

## Before Frontend Changes

Read these before frontend changes:

- [`PRODUCT_BRIEF.md`](PRODUCT_BRIEF.md)
- `CLAUDE.md`
- `README.md`
- `ACCESSIBILITY_PRIVACY.md`
- Frontend package/config files (if any exist yet)
- Existing component structure (if any exists yet)

## Frontend Architecture

**This repository has no frontend code yet.** The screens below describe the expected interface based on the essential flow in `PRODUCT_BRIEF.md` — they are not a description of anything implemented.

Expected screens:

- Capture/upload screen for one top or bottom
- Garment attribute confirmation screen (user corrects category/colour/pattern/etc. before recommendations run)
- Occasion selector (casual / work / going out) — optional input
- Outfit result cards showing the recommended combination visually
- Explanation text on each outfit card (why this combination works)
- Clear "Your item" vs "Suggested item" labeling on every card
- Loading, empty, error, and fallback states

Frontend rules:

- Keep "your item" visually identifiable in every outfit shown.
- Do not silently replace the user's garment with a different design in any generated visual.
- Show loading, empty, error, and fallback states — never a blank screen on failure.
- Mobile-first: this must work on a phone, since the success criteria require a stranger to complete the flow on a real phone.

## Backend / AI Rules

The backend should coordinate the garment-identification → confirmation → recommendation → explanation pipeline:

1. Validate garment image input.
2. Identify visible garment attributes (category, colour, pattern, and other confidently visible attributes) with confidence.
3. Return attributes for user confirmation/correction — do not generate recommendations before this step.
4. Accept confirmed/corrected attributes and optional occasion input.
5. Generate outfit recommendations built around the user's garment.
6. Return recommendations tagged with `ownership: "user_item" | "suggested_item"` and `source_state`.
7. Generate a short plain-language explanation per recommendation.

Responses should be structured and typed. Do not return hidden reasoning — return user-facing explanation only.

## Ask Before Large Changes

Ask before:

- Changing the target audience described in `PRODUCT_BRIEF.md`.
- Removing the garment-confirmation step.
- Adding fit, sizing, or body-type claims or features.
- Adding retailer integration, checkout, payments, or ads.
- Claiming a specific runtime AI vendor/model before it is verified (see ADR-004).
- Changing API response schemas.
- Adding heavy libraries.
- Making broad architectural rewrites.
