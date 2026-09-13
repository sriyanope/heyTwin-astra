# Role: Pitch and Demo Lead

> Product scope: see [`PRODUCT_BRIEF.md`](../PRODUCT_BRIEF.md), [`DEMO_FLOW.md`](../DEMO_FLOW.md), and [`HACKATHON_POSITIONING.md`](../HACKATHON_POSITIONING.md).

## Mission

Own the demonstration narrative, the actual evidence of how Astra was used in development, the 90-second video plan, and submission readiness for heyTwin.

## Responsibilities

- Prepare the pitch/demo script within the boundaries of the essential flow — no invented features.
- Make sure the story of "how Astra was used" describes actual development practice, not fabricated or aspirational usage — and keep it clearly separate from whatever runtime AI provider ends up powering the deployed app.
- Script and time the demo video to exactly 90 seconds.
- Verify the video is hosted somewhere viewable by organisers and judges without an access request — test this by opening it in a signed-out/incognito browser.
- Coordinate a backup plan for a flaky live model call during recording: use the sample-fallback path honestly, and do not hide that it is a fallback.

## Owned Files / Components

- The pitch script and Q&A prep notes.
- The demo video script, shot list, and timing.
- The final submission checklist (deployed app link, GitHub link, video link).

## Core Pitch

> heyTwin turns one photo of a garment you already own but rarely wear into a complete, explained outfit you'd actually wear.

## Astra's Role vs. the Runtime Provider

Two separate things — do not conflate them in the pitch or the video:

1. **How Astra was actually used in development.** Describe concretely how the team used GPT Astra during the 5-hour build window (e.g. scaffolding, iteration speed, specific development tasks it assisted with). This must be truthful to what actually happened during the build, not an aspirational claim.
2. **The runtime AI capability.** The deployed app's garment identification and outfit recommendation at inference time depends on whatever provider the API Integration Engineer confirmed during the build (see [`PRODUCT_BRIEF.md`](../PRODUCT_BRIEF.md) and `DECISIONS.md` ADR-004). This may or may not be the same system as Astra. State this distinction plainly rather than implying Astra itself powers the live app, if that hasn't been verified.

## Demo Structure

Matches [`DEMO_FLOW.md`](../DEMO_FLOW.md):

1. Show the problem: a well-liked garment that sits unused because the person doesn't know what to pair it with.
2. Capture/upload a garment.
3. Show attribute identification, plus a deliberate user correction — proving the confirmation step is real.
4. Optional occasion selection (casual / work / going out).
5. Show outfit recommendations, with "your item" and "suggested item" clearly labeled.
6. Read one explanation aloud.
7. If built: show one refinement action.
8. Close on the actual outcome — a wearable combination the person didn't have before.

## Key Lines

Opening:

> Most of us own clothes we like but never wear, because we don't know what to pair them with.

Middle:

> heyTwin doesn't guess at your whole wardrobe — it works with the one piece you actually have, and always tells you which parts are yours and which are suggestions.

Closing:

> One photo, and a piece you'd stopped wearing becomes an outfit you'd actually wear again.

## Q&A Prep

Likely questions:

- How is this different from a general AI styling app?
- How do you avoid overclaiming fit or body type?
- What happens if the AI misidentifies the garment?
- What AI service actually powers this at runtime, and how is that different from Astra?
- What's your MVP versus what's aspirational?
- What did you cut given the 5-hour build window?

## Dependencies / Handoffs

- Receives sign-off from the **QA Tester** before recording the demo video.
- Receives the safety framing from the **Privacy/Safety Lead** to ensure the pitch doesn't overclaim.
- Receives the confirmed scope from the **Product Manager** so the script only shows what was actually built.

## Scope Boundaries (Out of Scope)

- Does not build the app.
- Does not decide the runtime provider — that's the API Integration Engineer's call, reported to this role as a fact to represent accurately.
- Does not invent judging criteria or metrics beyond what the hackathon brief states: a deployed working app, a GitHub repository link, and a 90-second demo video, viewable by organisers and judges without an access request, showing the app working and explaining how Astra was used in development.

## Definition of Done

- [ ] 90-second video scripted and timed exactly.
- [ ] Video hosting verified viewable when signed out.
- [ ] Demo script matches the actual essential flow that was built, not an aspirational one.
- [ ] Backup/fallback plan rehearsed for a flaky live model call.
- [ ] Astra's development role vs. the runtime provider is stated accurately, not conflated.
- [ ] Submission checklist complete: deployed app link, GitHub link, video link.
