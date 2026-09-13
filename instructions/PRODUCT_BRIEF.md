# Product Brief — heyTwin

> **This document is the canonical product scope for heyTwin.**
> Every role file and supporting document links here instead of restating scope.
> If another document disagrees with this one about *what we are building*, this document wins
> (see precedence in [`AGENTS.md`](AGENTS.md)).

**Status:** Active. Last revised 13 September 2026.

## Project Name

**heyTwin** (formerly referred to as *TFR / The Fitting Room*).

## One-Liner

heyTwin takes a photo of one piece of clothing you already own and shows you complete outfits you could actually wear it in.

## Problem

People own clothes they like but rarely wear, because they do not know what to pair them with.

These "lonely clothes" stay in the wardrobe while people fall back on the same two or three familiar outfits. The result is that well-liked pieces stay underused, and people get less variety and less value out of clothes they already paid for.

The barrier is not owning clothes. It is **styling** them.

## Problem Statement

> People struggle to style individual clothing items they own into complete outfits they feel confident wearing. As a result, well-liked pieces remain underused, limiting the variety and value they get from their existing wardrobe.

## Proposed Solution

A mobile-first AI styling experience.

The user photographs or uploads **one top or bottom** they want to wear. The app reads the garment's visible attributes, then returns visual outfit recommendations built around that specific garment, each with a short explanation of why the combination works.

## Target Users

### Primary

- Fashion shoppers and everyday consumers who own clothes they like but struggle to style them.

This is the same consumer audience the product has always targeted. The hackathon scenario narrows the *situation* (one garment you cannot style), not the *demographic*. Do not add age, gender, body-type or income restrictions that are not in this brief.

### Secondary

- Anyone trying to get more wear out of an existing wardrobe.

## Desired Outcome

> Help someone discover a wearable combination for a piece they previously struggled to use.

That is the single outcome the demo must show. Everything else is supporting detail.

## Essential Flow (the MVP)

This is the flow that must work end to end on the deployed URL.

1. **Capture** — take or upload a photo of one top or bottom.
2. **Identify** — determine the garment's relevant visible attributes: category, colour, pattern (and other clearly visible attributes such as sleeve length or material impression where confident).
3. **Confirm** — let the user correct obvious identification mistakes before recommendations are generated.
4. **Recommend** — generate matching top-and-bottom recommendations built around the user's garment.
5. **Present** — show them visually, with the uploaded garment clearly identifiable in every outfit.
6. **Explain** — give a short, understandable reason why each combination works.

**Target:** three distinct outfit suggestions.
**Priority rule:** one reliable end-to-end result beats many unreliable options. If three is unstable, ship one or two that always work.

**Useful small input:** an occasion selector with simple choices — *casual*, *work*, *going out*. Cheap to build, visibly improves relevance, and gives the demo an obvious interaction beat.

## Prioritised Additions

Build these **only after the essential flow works end to end on the deployed URL**, in this order:

1. **Suggested shoes and accessories** — consistent with the submitted hackathon application.
2. **Colour coordination explained** within the outfit recommendation.
3. **One simple refinement action** — for example "make it more casual" or "change the shoes".
4. **Save a favourite locally** — only if inexpensive (browser-local; see [Product Honesty](#product-honesty) and [`ACCESSIBILITY_PRIVACY.md`](ACCESSIBILITY_PRIVACY.md)).

## Future Exploration

Not in this hackathon. Recorded so they are not re-litigated during the build:

- Optional user-provided body-type or styling preferences.
- Recommendations drawn from a more complete user wardrobe.
- Monetisation and premium features.

## Excluded From This Hackathon

These are **out of active scope**. Do not build them, do not design for them, and do not claim them in the pitch.

- 3D digital twins or avatars.
- Body scanning or measurement creation.
- Fit or size prediction.
- Virtual try-on.
- Full wardrobe onboarding.
- Retailer integrations, shopping checkout or live product search.
- Subscriptions, payments, advertisements and fashion article feeds.
- Unnecessary authentication or infrastructure.

Two hard rules that follow from this list:

- **Do not infer body type from a garment photo.**
- **Do not claim that a styling suggestion establishes physical fit.** heyTwin suggests what goes together. It says nothing about what will fit.

## Product Honesty

One uploaded garment does not reveal the user's wardrobe. The UI and the copy must keep this distinction visible at all times:

| Label | Meaning |
|---|---|
| **Your item** | The garment the user actually supplied. |
| **Suggested item** | A complementary piece the user may or may not own. |

Never imply that recommended clothes come from the user's wardrobe. This distinction is encoded in the API schema as `ownership: "user_item" \| "suggested_item"` — see [`API_CONTRACTS.md`](API_CONTRACTS.md).

Additional honesty rules:

- Do not invent product availability, purchase links, model capabilities or API access.
- Any sample or cached demonstration output must be labelled accurately in the UI (`source_state`).
- Do not silently replace the user's garment with a different design in any generated visual.

## Success Criteria for the Hackathon

Observable, checkable at 15:30 SGT — not aspirational metrics.

| # | Criterion | How it is verified |
|---|---|---|
| 1 | A stranger can open the deployed URL on a phone and complete capture → outfits without help. | QA runs it on a real phone on mobile data. |
| 2 | At least one outfit recommendation returns for a real garment photo taken during the demo. | Live run, not a cached sample. |
| 3 | The user's garment is visually identifiable in every outfit shown. | Visual check against the uploaded photo. |
| 4 | Every outfit carries a short explanation a non-expert understands. | Read aloud; no jargon. |
| 5 | Suggested items are visibly distinguished from the user's item. | Label present on every card. |
| 6 | Failures produce a readable message and a retry, never a blank screen. | Failure injection test. |
| 7 | A 90-second video, viewable without an access request, shows the app working and explains how Astra was used. | Opened in a signed-out browser. |

## Product Risks

| Risk | Mitigation | Owner |
|---|---|---|
| Garment identification is wrong (colour under poor lighting, pattern confusion). | User confirmation step before recommendations. | AI Engineer |
| Model provider access, capability or latency is not what we assume. | 30-minute spike first; see [`ROADMAP.md`](ROADMAP.md). **Unverified — see [`DECISIONS.md`](DECISIONS.md) ADR-004.** | API Integration Engineer |
| Generated outfit imagery is slow, or replaces the user's garment with a different design. | Default visual approach avoids generated imagery; see [`ARCHITECTURE.md`](ARCHITECTURE.md). | UX/UI Designer |
| Recommendations read as generic and unconvincing. | Explanations must cite visible attributes of *this* garment. | AI Engineer |
| Scope creep consumes the five hours. | Feature freeze at 14:40 SGT. | Product Manager |
| Demo video exceeds or misses 90 seconds, or is not viewable by judges. | Scripted to 90s, verified signed-out. | Pitch/Demo Lead |

## Product Hypotheses (Unvalidated)

Stated explicitly so they are not repeated as findings. We have **not** run user research for heyTwin in this repo.

- **H1** — Users have specific garments they avoid wearing for styling reasons. *Unvalidated.*
- **H2** — A visual outfit board is more convincing than a text list of suggestions. *Unvalidated.*
- **H3** — A short "why this works" explanation increases confidence in wearing the combination. *Unvalidated.*
- **H4** — One garment is enough input to produce a suggestion users find wearable. *Unvalidated — this is the core product bet.*

Do not present these as evidence in the pitch. Present them as the bet the prototype is testing.

## Superseded Direction

The initial documentation pack in this repository described a different product: **FamLens**, an Agnes-AI accessibility companion for visually impaired elderly users handling family photos. That direction is **superseded and inactive**. No FamLens requirement (spoken summaries, OCR reading, family labels, reply drafting) is in scope.

Earlier heyTwin/TFR framing around digital twins, body measurements, sizing prediction and virtual fitting rooms is likewise **superseded**. No market-size estimate, fit-return statistic or claim of unique market positioning from that earlier framing carries over as evidence for this styling product.
