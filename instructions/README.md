# heyTwin

## Overview

**heyTwin** (formerly referred to as *TFR / The Fitting Room*) is a mobile-first AI styling app.

The user photographs or uploads one top or bottom they already own. The app identifies the garment's visible attributes, the user confirms or corrects them, and the app returns visual outfit recommendations built around that specific garment — each with a short, plain-language explanation of why it works.

The goal is not to describe the garment. The goal is to help someone discover a wearable combination for a piece they previously struggled to style.

## One-Liner

heyTwin takes a photo of one piece of clothing you already own and shows you complete outfits you could actually wear it in.

## Problem

People own clothes they like but rarely wear, because they do not know what to pair them with.

These "lonely clothes" stay in the wardrobe while people fall back on the same two or three familiar outfits. The barrier is not owning clothes — it is styling them.

## Product Promise

When a user photographs one top or bottom, heyTwin helps them:

- See the garment's visible attributes reflected back accurately (and correct them if wrong).
- Get outfit recommendations built specifically around that garment.
- See the outfit presented visually, with their own item clearly identifiable.
- Understand, in plain language, why each combination works.

## Essential Flow (the MVP)

This is the flow that must work end to end on the deployed URL. See [`PRODUCT_BRIEF.md`](PRODUCT_BRIEF.md) for full detail.

1. **Capture** — take or upload a photo of one top or bottom.
2. **Identify** — determine the garment's relevant visible attributes: category, colour, pattern (and other clearly visible attributes where confident).
3. **Confirm** — let the user correct obvious identification mistakes before recommendations are generated.
4. **Recommend** — generate matching top-and-bottom recommendations built around the user's garment.
5. **Present** — show them visually, with the uploaded garment clearly identifiable in every outfit.
6. **Explain** — give a short, understandable reason why each combination works.

**Target:** three distinct outfit suggestions. One reliable end-to-end result beats many unreliable options.

**Useful small input:** an occasion selector (casual / work / going out).

## Core Differentiator

The differentiator is not **"an app that shows outfits."**

The differentiator is turning **one specific, underused garment** into a confident, visually presented, explained outfit — keeping the user's own item visually central and clearly distinguished from what is merely suggested.

## Main Features

### MVP (Essential Flow)

- Garment capture/upload (one top or bottom)
- Attribute identification (category, colour, pattern, and other confidently visible attributes)
- User confirmation/correction of identified attributes
- Occasion selector (casual / work / going out)
- Outfit recommendation generation (target: three)
- Visual presentation distinguishing "your item" from "suggested items"
- Short plain-language explanation per outfit

### Prioritised Additions (only after the essential flow works end to end)

1. Suggested shoes and accessories.
2. Colour coordination explained within the recommendation.
3. One simple refinement action (e.g. "make it more casual", "change the shoes").
4. Save a favourite locally (browser-local; see [`ACCESSIBILITY_PRIVACY.md`](ACCESSIBILITY_PRIVACY.md)).

### Future Exploration (not in this hackathon)

- Optional user-provided body-type or styling preferences.
- Recommendations drawn from a more complete user wardrobe.
- Monetisation and premium features.

See [`PRODUCT_BRIEF.md`](PRODUCT_BRIEF.md) for the full list of exclusions (no 3D digital twins, body scanning, fit/size prediction, virtual try-on, full wardrobe onboarding, retailer integration/checkout, payments/ads, or unnecessary auth).

## Tech Stack

**No stack has been chosen in this repository yet, and no application code exists as of this writing.** Do not assume a framework (e.g. Next.js, FastAPI) is decided — check for actual app code before building against any stack assumption. If code already exists by the time you read this, retain the existing/suitable stack rather than migrating frameworks without a concrete necessity.

The **runtime AI/vision-styling model provider is also TBD and unverified** — see [`PRODUCT_BRIEF.md`](PRODUCT_BRIEF.md) and [`DECISIONS.md`](DECISIONS.md) ADR-004. **GPT Astra** is the development platform the team uses to build heyTwin; it is not the runtime AI service the deployed app calls.

## Important Docs

| File | Purpose |
|---|---|
| `README.md` | This file — overview, essential flow, features, stack status, and docs index |
| `AGENTS.md` | Coding-agent instructions and project guardrails |
| `CLAUDE.md` | Source of truth for the AI pipeline and product behavior |
| `PRODUCT_BRIEF.md` | **Canonical scope** — problem, users, essential flow, exclusions, honesty rules, risks |
| `HACKATHON_POSITIONING.md` | Judging story, differentiator, and the Astra-vs-runtime-provider distinction |
| `DEMO_FLOW.md` | Demo narrative and backup plan |
| `ARCHITECTURE.md` | System structure |
| `API_CONTRACTS.md` | Backend schemas |
| `DATA_FLOW.md` | End-to-end data processing flow |
| `FRONTEND.md` | Frontend architecture and UI rules |
| `BACKEND.md` | Backend responsibilities and AI pipeline integration rules |
| `ACCESSIBILITY_PRIVACY.md` | Privacy, consent, and product-honesty-adjacent safety rules |
| `DESIGN_SYSTEM.md` | Visual and interaction design guidelines |
| `ROADMAP.md` | Milestones and time-boxed priorities for the 5-hour build |
| `TESTING.md` | Manual tests and QA checklist |
| `ENVIRONMENT.md` | Environment variables and secrets handling |
| `DECISIONS.md` | Architecture decision records, including ADRs on the FamLens/TFR-to-heyTwin pivot and the unverified runtime provider |
| `roles/` | Individual role responsibilities |
