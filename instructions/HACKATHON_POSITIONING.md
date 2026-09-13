# Hackathon Positioning

## Track Context

This is built for a **GPT Astra hackathon**: a two-person team, with a 5-hour build window (10:30am–3:30pm SGT, 13 September 2026). These are the stated facts for this build; do not invent additional judging criteria beyond what is required for submission (a deployed working app, a GitHub repo link, and a 90-second demo video viewable by organisers/judges without an access request).

## Astra vs. the Runtime Provider

These are two different things and the pitch must not conflate them:

- **GPT Astra** is the AI development platform/coding assistant the team used to *build* heyTwin during the hackathon.
- The **runtime vision/styling model provider** — the service the deployed app actually calls to identify garments and generate recommendations — is **unverified and TBD** (see [`PRODUCT_BRIEF.md`](PRODUCT_BRIEF.md) and [`DECISIONS.md`](DECISIONS.md) ADR-004).

The demo video should explain how Astra was used in *development*. It should not overclaim a specific runtime AI vendor's involvement if that has not been verified by the time of recording.

## Core Positioning

The differentiator is not:

> "We built an app that shows outfits."

The differentiator is:

> "We turn one specific, underused garment into a confident, visually presented, explained outfit — keeping the user's own item visually central and clearly distinguished from what's merely suggested."

## Why This Matters

People own clothes they like but rarely wear, because they do not know what to pair them with. These "lonely clothes" stay in the wardrobe while people fall back on the same familiar outfits.

A generic styling tool might say:

> "Here are some outfits."

heyTwin should say:

> "Here's your striped blue top, paired with a suggested navy trouser and white sneaker for a casual look — the stripe pattern works with solid pieces so it doesn't compete for attention."

## What Judges Should Notice

- The user problem is specific and human: a garment the user already owns but doesn't wear.
- The AI is essential to the workflow: garment attribute identification, outfit recommendation, and plain-language explanation.
- The execution is visual and mobile-first, matching how the essential flow is meant to be used.
- The app handles "your item" vs "suggested item" honestly — never implying suggested pieces come from the user's actual wardrobe.
- The app is reliable given the time constraint: one dependable end-to-end result beats several unreliable ones.

## What Not To Claim

Do not claim:

- Invented purchase links, retailer availability, or "buy this" functionality.
- Any claim that a recommendation predicts or guarantees fit or size.
- That suggested items represent the user's actual wardrobe.
- Involvement of a specific runtime AI vendor or model that has not been verified (see ADR-004) — including inside the demo video.
- That styling equals fit — heyTwin says what goes together, not what will fit the user's body.

Better claim:

> heyTwin helps someone rediscover a garment they own by showing them, visually, how it can be worn — and explains why, in plain language.

## Demo Arc

1. Show the problem: a garment the user owns but doesn't know how to style.
2. Capture/upload the garment.
3. Show the attribute identification step, and the user correcting or confirming it — this is the honesty moment, not a skip-able formality.
4. Optionally pick an occasion (casual / work / going out).
5. Show the outfit recommendations, with "your item" clearly distinguished from "suggested items."
6. Read the plain-language explanation for at least one outfit aloud.
7. End on the outcome: the user now has a wearable combination for a piece they previously struggled to use.
