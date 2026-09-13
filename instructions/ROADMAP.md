# Roadmap

## Current Goal

Prepare heyTwin for a GPT Astra hackathon demo within a 5-hour build window (10:30am–3:30pm SGT, 13 September 2026). See [`PRODUCT_BRIEF.md`](PRODUCT_BRIEF.md) for full scope.

## Milestone 1: Core Demo Loop

The essential flow, working end to end, deployed.

- [ ] Test the riskiest AI/visual integration first (garment identification and/or outfit recommendation) — this is a 30-minute spike, not a full build.
- [ ] Build capture/upload screen for one top or bottom.
- [ ] Connect backend to the (TBD, unverified) vision/styling model provider — or a stubbed/sample response if the provider spike is still unresolved.
- [ ] Identify garment attributes (category, colour, pattern).
- [ ] Show attributes for user confirmation/correction.
- [ ] Generate at least one outfit recommendation.
- [ ] Present the outfit visually, with "your item" vs "suggested item" distinguished.
- [ ] Deploy a working end-to-end version early, even with only one outfit.

## Milestone 2: AI Depth

- [ ] Expand to three distinct outfit recommendations.
- [ ] Add a short plain-language explanation per outfit.
- [ ] Add the occasion selector (casual / work / going out).
- [ ] Add confidence and `source_state` (live/cache/sample/fallback) to AI outputs.
- [ ] Add a sample fallback response for demo reliability.

## Milestone 3: Prioritised Additions (only if time remains)

- [ ] Suggested shoes and accessories.
- [ ] Colour coordination explained within the recommendation.
- [ ] One simple refinement action (e.g. "make it more casual").
- [ ] Save a favourite locally (browser-local only).

## Milestone 4: Demo Readiness

- [ ] Freeze features with enough time left for testing, recording, and submission.
- [ ] Prepare 3 sample garment photos (clear, patterned, ambiguous/poor-lighting) per `CLAUDE.md` Demo Guardrails.
- [ ] Prepare fallback sample responses, labeled honestly as sample/fallback.
- [ ] Record the 90-second demo video, explaining how Astra was used in development.
- [ ] Verify the demo video is viewable by organisers/judges without an access request (check in a signed-out browser).
- [ ] Verify the deployed app works on a real phone, on mobile data, without help.
- [ ] Remove secrets from the repo.
- [ ] Verify README setup commands.
- [ ] Confirm GitHub repo link and deployed URL are both ready for submission.

## Proposed Time Blocks (10:30–15:30 SGT)

This is a proposed plan, not a guarantee — adjust as the build reveals real constraints.

| Time | Block |
|---|---|
| 10:30–11:00 | Risk spike: confirm the runtime vision/styling model provider works for garment identification and/or recommendation (Milestone 1, first item). |
| 11:00–13:00 | Build the essential flow end to end and deploy it (Milestone 1). |
| 13:00–14:00 | AI depth and prioritised additions, time permitting (Milestones 2–3). |
| 14:00–14:40 | Feature freeze and polish. |
| 14:40–15:10 | Record the 90-second demo video. |
| 15:10–15:30 | Submission buffer: verify links, signed-out viewability, and final checklist. |

## Priority Rules

1. Reliability before extra outfits — one dependable end-to-end result beats three unreliable ones.
2. Honesty about item provenance ("your item" vs "suggested item") before visual polish.
3. Essential flow before prioritised additions.
4. Test the riskiest AI/visual integration early, not last.
5. Deploy early and keep it deployed; do not leave deployment until the end.
