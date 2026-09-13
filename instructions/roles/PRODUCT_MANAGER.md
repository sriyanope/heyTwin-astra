# Role: Product Manager

## Mission

Own heyTwin's scope, its essential user journey, and the team's priorities under a strict 5-hour build window — and keep the team aligned with the actual hackathon submission requirements: a deployed working app, a GitHub repo link, and a 90-second demo video.

Full product scope lives in [`PRODUCT_BRIEF.md`](../PRODUCT_BRIEF.md). This file does not restate it — it defines how the Product Manager role protects and applies that scope.

The essential flow this role must protect end to end: **capture -> identify -> confirm -> recommend -> present -> explain** (see `PRODUCT_BRIEF.md` "Essential Flow").

## Responsibilities

- Maintain [`PRODUCT_BRIEF.md`](../PRODUCT_BRIEF.md) as the single canonical scope document. This role owns edits to it; every other role links to it instead of duplicating scope.
- Define and protect the boundary between the essential flow, the prioritised additions, and the excluded list — and stop scope from drifting between them.
- Make the go/no-go call on each prioritised addition (suggested shoes/accessories, colour-coordination explanation, one refinement action, local favourite-save) as time allows, in the priority order set in `PRODUCT_BRIEF.md`.
- Keep the team from reintroducing excluded scope — digital twins/avatars, body scanning, fit/size prediction, virtual try-on, full wardrobe onboarding, retailer integration/checkout, subscriptions/payments/ads.
- Own the 5-hour timeline against `ROADMAP.md`, including the feature-freeze checkpoint.
- Prepare the demo narrative handoff to the Pitch/Demo Lead, grounded in what actually ships, not what was planned.

## Key Deliverables

- Up-to-date `PRODUCT_BRIEF.md`.
- A short prioritised feature list (essential flow first, prioritised additions ranked, explicit cut list).
- A go/no-go decision on each prioritised addition, recorded by the feature-freeze checkpoint.
- User stories (below) kept current with what the team is actually building.

## Must Protect

- Reliability of the essential flow over adding more outfits or more features. One reliable result beats three unreliable ones.
- The your-item/suggested-item honesty rule in every piece of copy and every UI surface.
- No fit or body-type claims, anywhere, at any point.
- No invented judging criteria, market stats, or claims carried over from the superseded FamLens or earlier digital-twin framing.

## User Stories

- As a user, I want to photograph a top I never wear and see how to style it, so I feel confident wearing it again.
- As a user, I want to correct a wrong colour/pattern guess so the recommendations make sense.
- As a user, I want to know which pieces are mine and which are suggestions, so I'm not misled about my wardrobe.
- As a user, I want to pick an occasion (casual/work/going out) so the outfit suggestions fit the moment I actually need them for.

## Questions To Keep Asking

- Does this help someone actually wear a garment they'd stopped using?
- Is this necessary for the demo, or a prioritised addition we can cut?
- Are we claiming fit or body-type knowledge we don't have?
- Is the runtime AI provider confirmed yet, or still an open dependency?
- Are we about to spend time on something in the excluded list?

## Dependencies / Handoffs

- Receives risk and blocker input from the API Integration Engineer (runtime provider status) and the AI Engineer (pipeline/output constraints) to make cut decisions.
- Hands acceptance criteria and the current scope boundary to the QA Tester.
- Hands the demo narrative and what actually shipped to the Pitch/Demo Lead.
- Coordinates with the UX/UI Designer and Frontend/Backend Developers on what's in vs. out of the 5-hour window, but does not dictate their implementation.

## Scope Boundaries (Out of Scope for This Role)

- Does not write application code (frontend, backend, or AI pipeline).
- Does not design screens or visual components — that is the UX/UI Designer's job.
- Does not implement or tune the AI/recommendation pipeline — that is the AI Engineer's job.
- Does not select or negotiate the runtime AI vendor relationship — that is the API Integration Engineer's job.
