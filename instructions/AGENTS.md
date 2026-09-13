# Agent Instructions

This project is **FamLens**.

## Current Product Direction

FamLens is an AI-native accessibility companion for visually impaired elderly users.

It helps users understand family photos and WhatsApp images through spoken, personal, emotionally meaningful, and conversational descriptions.

The product is not a generic chatbot and not a generic image captioning app.

The main product flow is:

1. User uploads or shares a family image.
2. Backend sends image and context to the AI pipeline.
3. AI extracts scene, people cues, text, emotion, and uncertainty.
4. App produces a short spoken summary.
5. User can ask follow-up questions by voice.
6. App can generate a warm reply for WhatsApp or family chat.

## Source of Truth

Use these files as source of truth:

- `CLAUDE.md` for AI workflow, product direction, backend contracts, and demo guardrails.
- `README.md` for implemented features and setup.
- `PRODUCT_BRIEF.md` for user problem, positioning, and MVP scope.
- `ACCESSIBILITY_PRIVACY.md` for accessibility, privacy, consent, and safety rules.
- Existing code for current conventions.

If documents conflict, prefer this order:

1. This `AGENTS.md`
2. `CLAUDE.md`
3. `ACCESSIBILITY_PRIVACY.md`
4. `README.md`
5. Existing code

## Hackathon Positioning

The differentiator is not **"a nice AI image describer."**

The differentiator is the **best use of Agnes AI API as a multimodal accessibility agent.**

FamLens should show Agnes AI turning a family photo into:

- A short elder-friendly spoken summary
- A detailed description on request
- OCR text reading
- Emotional context
- Relationship-aware interpretation when context is available
- Follow-up Q&A
- A warm reply draft

Do not expose hidden chain-of-thought. Show user-facing rationale, uncertainty, evidence, confidence, and final recommendations.

## Non-Negotiables

- Keep the product focused on visually impaired elderly users.
- Keep the main use case focused on family photos and WhatsApp-style image messages.
- Do not turn the product into a generic image-captioning tool.
- Do not overclaim identity recognition.
- Do not say a person is definitely someone unless the user or family has explicitly labeled them and confidence is high.
- Use uncertainty wording such as "I think", "possibly", or "I am not fully sure" when needed.
- Do not store family photos by default.
- Do not commit secrets, API keys, tokens, or private credentials.
- Keep demo reliability ahead of visual polish.

## Before Frontend Changes

Read these before frontend changes:

- `CLAUDE.md`
- `README.md`
- `PRODUCT_BRIEF.md`
- `ACCESSIBILITY_PRIVACY.md`
- Frontend package/config files
- Existing component structure

## Frontend Architecture

Use the existing frontend if available.

Expected interface:

- Large primary button: "Describe Photo"
- Image upload or share simulation
- Voice-first output
- Large text transcript
- Follow-up question input
- Simple reply draft area
- Confidence and uncertainty messages
- Caregiver/family setup option if implemented

Frontend rules:

- Use large touch targets.
- Support screen readers.
- Use high contrast.
- Avoid small text and complex gestures.
- Do not rely on hover-only interactions.
- Make audio controls obvious: play, pause, repeat, slower.
- Show loading, empty, error, and fallback states.

## Backend / AI Rules

The backend should coordinate an AI pipeline:

1. Validate image input.
2. Analyse image scene.
3. Extract visible text.
4. Generate short summary.
5. Generate detailed description.
6. Answer follow-up questions.
7. Generate optional reply.
8. Return confidence and uncertainty metadata.

Responses should be structured and typed.

Do not return hidden reasoning. Return user-facing explanation only.

## Expected Workspace

The expected product workspace includes:

- Image input area
- Voice/audio output controls
- Short summary card
- Detailed description card
- OCR/text card
- Ask follow-up section
- Reply draft section
- Confidence and privacy notice
- Optional family context setup

## Implementation Priorities

1. Make image-to-spoken-summary work reliably.
2. Add follow-up Q&A.
3. Add OCR reading.
4. Add reply drafting.
5. Add confidence and uncertainty states.
6. Add accessibility polish.
7. Add family-context memory only after core flow works.

## Ask Before Large Changes

Ask before:

- Changing the target user group.
- Moving away from family photos or WhatsApp-style images.
- Removing voice-first interaction.
- Adding face recognition or identity memory.
- Storing photos or family labels.
- Changing API response schemas.
- Adding heavy libraries.
- Making broad architectural rewrites.
