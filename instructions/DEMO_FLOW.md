# Demo Flow

## Demo Goal

Show that FamLens helps visually impaired elderly users understand and respond to family images using Agnes AI.

The demo should prove that Agnes AI is used as a multimodal workflow engine, not just a text generator.

## Demo Setup

Use 3 safe sample images:

1. Birthday photo
2. WhatsApp travel/photo update with visible text
3. Blurry or ambiguous family image

## Scene 1: Problem

Narration:

> Family updates often arrive as photos. For visually impaired elderly users, this can make them feel left out of the moment.

Show a WhatsApp-style message with an image.

## Scene 2: Upload / Share Image

User opens FamLens and selects:

> Describe Photo

The app shows:

- Image selected
- Processing started
- Voice output loading state

Status:

> "I am looking at the photo now."

## Scene 3: Short Spoken Summary

FamLens says:

> "This looks like a birthday celebration. A child is smiling beside a cake. The cake appears to say Happy Birthday Ethan."

UI shows:

- Short summary
- Play/repeat button
- "Tell me more" button
- "Ask a question" button

## Scene 4: Detailed Description

User taps:

> Tell me more

FamLens says:

> "There are several people gathered indoors around a table. The child in the middle looks happy. There are candles on the cake, and the room feels like a warm family gathering."

## Scene 5: OCR Text Reading

User asks:

> "What does the cake say?"

FamLens answers:

> "The cake appears to say Happy Birthday Ethan. The text is partly small, so I am not fully certain about every word."

## Scene 6: Family Context

If using family labels:

> "This may be your grandson Ethan. I am not fully sure, but it matches the saved family label."

Important: uncertainty must be visible.

## Scene 7: Reply Draft

App asks:

> "Would you like help replying?"

FamLens drafts:

> "Looks like such a happy birthday celebration. I’m so happy to see everyone smiling. Send my love to Ethan."

User can:

- Copy reply
- Regenerate warmer reply
- Make it shorter
- Cancel

## Scene 8: Ambiguous Image

Show a blurry image.

FamLens says:

> "I am not fully sure who is in this photo. I can see one person standing near a table, but the face is blurry."

This proves safe AI behavior.

## Closing Line

> FamLens turns family photos into spoken understanding, follow-up conversation, and warm replies, helping visually impaired elderly users stay part of the moment.

## Backup Plan

If live AI fails:

- Use cached sample response.
- Show source state as "sample fallback."
- Continue the demo honestly.
- Do not pretend fallback output is live.

## Demo Checklist

- [ ] Image upload works.
- [ ] Short description appears.
- [ ] Voice output works or is simulated.
- [ ] Follow-up Q&A works.
- [ ] OCR example works.
- [ ] Reply draft works.
- [ ] Uncertainty example works.
- [ ] Privacy note appears.
- [ ] Demo can run without real WhatsApp integration.
