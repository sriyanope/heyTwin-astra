# Design System

> Product scope lives in [`PRODUCT_BRIEF.md`](PRODUCT_BRIEF.md). This document only covers visual and interaction design conventions for heyTwin.

## Product Feel

heyTwin should feel:

- Confident
- Stylish
- Clear
- Encouraging
- Trustworthy
- Effortless

It should not feel:

- Clinical
- Like a shopping catalogue pretending to know the user's wardrobe
- Cluttered
- Falsely certain about fit

## Visual Direction

Recommended style:

- Large, legible garment and outfit imagery — this is the priority visual element on every screen
- High contrast text and controls
- Clear, uncluttered cards
- Calm, neutral colour palette that lets garment photos stand out
- Clear focus states
- Minimal chrome around the imagery — avoid visual elements that compete with the clothing itself

## Typography

Use:

- Clear, readable typeface
- Strong heading hierarchy
- Legible base font size
- Avoid dense paragraphs; keep explanations short

## Layout

Primary layout:

```text
Top: Simple title / step indicator
Center: Garment or outfit imagery (primary focus)
Bottom: Primary action and secondary controls
```

## Core Components

- Garment photo card
- Attribute confirmation chips/controls
- Occasion selector
- Outfit board / outfit cards
- Item ownership badge ("Your item" / "Suggested item")
- Explanation text block
- Confidence note
- Sample/fallback indicator
- Refinement controls
- Favorite button

## Interaction Principles

- One main action per screen
- The garment image always stays visible and legible — never obscure it behind controls
- Ownership labeling ("Your item" / "Suggested item") is always visible, never ambiguous or omitted
- The user confirms or corrects identified attributes before recommendations are generated
- Show honest, plain-language empty and error states
- Never trap the user in a loading state — always provide a retry or way out

## Agent UI Principles

Agent-facing copy should be:

- Short
- User-facing
- Honest about uncertainty
- Free from hidden reasoning or technical jargon

Example — attribute identification:

> "This looks like a navy floral top."

Example — outfit explanation:

> "These pair well because the muted tones in the trousers complement the pattern in your top."

## Empty States

Example:

> "No item added yet. Add a photo of one top or bottom, and I'll suggest outfits to go with it."

## Error States

Example:

> "I couldn't clearly identify this garment — the photo may be too blurry or dark. Try another photo, or adjust the details below yourself."

## Confidence Notes

These describe confidence about a **garment attribute**, never about a person.

High confidence:

> "I'm confident this is a navy top."

Medium confidence:

> "This looks like a floral pattern, but part of the photo is hard to read."

Low confidence:

> "I'm not fully sure about the pattern on this piece — you can correct it below."
