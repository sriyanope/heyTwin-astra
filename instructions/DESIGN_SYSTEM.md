# Design System

## Product Feel

FamLens should feel:

- Gentle
- Clear
- Trustworthy
- Warm
- Calm
- Human
- Accessible

It should not feel:

- Clinical
- Technical
- Overloaded
- Childish
- Robotic
- Surveillance-like

## Visual Direction

Recommended style:

- High contrast
- Large text
- Rounded cards
- Minimal layout
- Calm color palette
- Clear focus states
- Large audio controls

## Typography

Use:

- Large base font size
- Clear readable typeface
- Strong heading hierarchy
- Avoid thin fonts
- Avoid dense paragraphs

## Layout

Primary layout:

```text
Top: Simple title and privacy indicator
Center: Main action / summary
Bottom: Audio controls and next actions
```

## Core Components

- Upload button
- Summary card
- Audio control bar
- Detail card
- Question panel
- Reply draft card
- Confidence note
- Privacy notice
- Family label card

## Interaction Principles

- One main action per screen
- Audio and text always paired
- Repeat is always available
- User confirms before final actions
- Never trap user in loading state
- Show plain-language errors

## Agent UI Principles

Agent messages should be:

- Short
- Spoken-friendly
- User-facing
- Honest about uncertainty
- Free from hidden reasoning

Example:

> "I found some text in this photo. It appears to say Happy Birthday Ethan."

## Empty States

Example:

> "No photo selected yet. Choose a photo, and I will describe it aloud."

## Error States

Example:

> "I could not clearly understand this image. It may be too blurry. You can try another photo or ask me a simpler question."

## Confidence Notes

High confidence:

> "I am fairly confident this is a birthday photo."

Medium confidence:

> "I think this may be a birthday photo, but part of the image is blurry."

Low confidence:

> "I am not fully sure what this photo shows."
