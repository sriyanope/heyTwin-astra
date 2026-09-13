# Architecture Decision Records

Use this file to record major project decisions.

## ADR Template

### ADR-[Number]: [Decision Title]

**Date:** [YYYY-MM-DD]

**Status:** [Proposed / Accepted / Superseded / Deprecated]

### Context

[What problem or decision are we facing?]

### Decision

[What did we decide?]

### Alternatives Considered

- [Alternative 1]
- [Alternative 2]
- [Alternative 3]

### Consequences

Positive:

- [Positive consequence]

Tradeoff:

- [Tradeoff]

---

## ADR-001: Focus on Family Photo Conversations

**Date:** [YYYY-MM-DD]

**Status:** Superseded

> This ADR applied to the earlier FamLens direction and is retained for historical context only. It does not describe heyTwin. See ADR-003.

### Context

The initial idea could become a broad visual assistance app. This is too wide for a hackathon MVP.

### Decision

FamLens will focus on visually impaired elderly users receiving family photos or WhatsApp-style image messages.

### Alternatives Considered

- General object detection app
- Navigation assistant
- Document reader
- Medical accessibility app

### Consequences

Positive:

- Clear emotional use case
- Stronger demo story
- Better differentiation from generic accessibility tools

Tradeoff:

- Narrower scope
- Requires careful privacy and consent design

---

## ADR-002: Voice-First Interface

**Date:** [YYYY-MM-DD]

**Status:** Superseded

> This ADR applied to the earlier FamLens direction and is retained for historical context only. heyTwin is a mobile-first visual styling app, not a voice-first accessibility tool. See ADR-003.

### Context

The target users may not be able to rely on visual UI.

### Decision

FamLens will prioritize spoken descriptions, repeat controls, and large touch targets.

### Consequences

Positive:

- Better accessibility
- Stronger user fit

Tradeoff:

- Requires more careful audio state handling

---

## ADR-003: Adopt heyTwin Styling-From-One-Garment Direction

**Date:** 2026-09-13

**Status:** Accepted

### Context

This repository's instructions pack originally documented FamLens, an accessibility companion for visually impaired elderly users interpreting family photos. Separately, an earlier framing of this same product line (TFR / The Fitting Room) focused on 3D digital twins, body scanning, and virtual fitting rooms. Neither direction matches the product now being built for this hackathon.

### Decision

Adopt **heyTwin** as the product direction: a mobile-first AI styling app that takes a photo of one top or bottom the user owns and returns visual, explained outfit recommendations built around it. This supersedes both the FamLens direction and the prior TFR digital-twin/fitting-room framing. [`PRODUCT_BRIEF.md`](PRODUCT_BRIEF.md) is the canonical scope document going forward.

### Alternatives Considered

- Continue FamLens (accessibility/family-photo companion).
- Continue the earlier TFR framing (digital twins, body scanning, fit/size prediction, virtual try-on).
- A full wardrobe-onboarding styling app.

### Consequences

Positive:

- Scope matches what the team is actually building and can finish in 5 hours.
- Removes fit/sizing and body-scanning claims that would overreach what a hackathon prototype can honestly deliver.

Tradeoff:

- All prior documentation content describing FamLens or the digital-twin framing needed to be rewritten or explicitly marked superseded rather than deleted, to preserve historical context.

---

## ADR-004: Runtime AI/Vision Provider Is Unverified

**Date:** 2026-09-13

**Status:** Proposed — open/unverified item

### Context

The team uses **GPT Astra** as the AI development platform/coding assistant to build heyTwin. Astra is a build-time tool, not necessarily the runtime service the deployed app calls to identify garments or generate outfit recommendations. As of this writing, no runtime vision/styling model provider has been confirmed.

### Decision

Treat the runtime AI/vision provider as **unverified and TBD**. Do not assume Astra provides runtime inference or image generation for the deployed app. The API Integration Engineer must confirm the actual runtime provider, its capabilities, and its latency in the first 30 minutes of the build (see [`ROADMAP.md`](ROADMAP.md)), before other work depends on a specific provider's behavior.

### Alternatives Considered

- Assume Astra also serves runtime inference calls (rejected — unverified, conflates a dev tool with a runtime dependency).
- Name a specific vendor now to move faster (rejected — risks an unverifiable or false claim in the pitch and code).

### Consequences

Positive:

- Avoids shipping or pitching a false claim about which AI service powers the app.
- Forces the highest-risk dependency to be tested first, in line with the roadmap's risk-spike priority.

Tradeoff:

- Some early build decisions (e.g. exact request/response shape in `API_CONTRACTS.md`) may need to be revisited once the real provider is confirmed.

---

## ADR-005: Visual Presentation Approach for Outfit Boards

**Date:** 2026-09-13

**Status:** Proposed — pending UX/AI engineer decision

### Context

heyTwin must present the user's own garment alongside suggested complementary items, with the user's item clearly identifiable in every outfit shown (see `PRODUCT_BRIEF.md` Product Honesty and Success Criteria). Two broad approaches exist: (a) retain the user's original garment photo directly in the outfit board, pairing it with catalogue/generated images of complementary items, or (b) generate a fully new, AI-generated re-imagining of the entire outfit including the user's garment.

### Decision

Default to **retaining the original garment photo** alongside catalogue/generated images of complementary items, rather than generating full AI re-imagery of the user's garment.

### Alternatives Considered

- Full AI-generated re-imagery of the entire outfit, including a regenerated version of the user's garment.
- A hybrid where the user's garment is generated only when confidence in preserving its exact appearance is very high.

### Consequences

Positive:

- Guarantees the user's item is never silently replaced with a different design, satisfying the Product Honesty rule and Success Criterion 3.
- Avoids the added latency and failure risk of full-scene image generation under a 5-hour build constraint.

Tradeoff:

- Visual consistency between the retained garment photo and generated/catalogue complementary images may look less seamless than a fully generated scene.
- If generated imagery is introduced later for complementary items or the full scene, garment-preservation risk (the model altering the user's actual garment) and added latency must be re-evaluated before defaulting to it.
