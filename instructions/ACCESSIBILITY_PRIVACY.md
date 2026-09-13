# Accessibility, Privacy, and Safety

## Accessibility Principles

FamLens is for visually impaired elderly users. Accessibility is not a bonus feature. It is the product.

## UX Requirements

The interface should be:

- Voice-first
- Simple
- High contrast
- Screen-reader compatible
- Large touch target friendly
- Low cognitive load
- Forgiving of mistakes
- Usable with caregiver support

## Required Accessibility Features

- Text-to-speech output
- Transcript for every spoken answer
- Repeat button
- Pause button
- Slow speech option
- Large buttons
- Clear labels
- Keyboard navigation
- Screen-reader labels
- High contrast mode
- No gesture-only controls
- No time-limited interactions without pause

## Elder-Friendly Language

Use:

- Short sentences
- Warm but not childish tone
- Clear uncertainty wording
- No technical jargon
- No overwhelming detail upfront

Avoid:

- "Object detected"
- "Model confidence score is low"
- "Vision inference failed"
- Long paragraphs
- Overly cheerful or patronizing language

Better:

> "I am not fully sure because the photo is blurry."

## Privacy Principles

Family photos are sensitive.

Photos may include:

- Faces
- Children
- Homes
- Private events
- Location clues
- Screenshots
- Personal messages

## Privacy Requirements

- Do not store uploaded photos by default.
- Use temporary processing.
- Allow photo deletion.
- Make family labels opt-in.
- Let users delete family labels.
- Do not train models on user photos.
- Do not send messages automatically.
- Do not expose image contents in logs.
- Do not share data with family unless user confirms.

## Consent Rules

Family identity labels require consent.

Acceptable:

> "This is Ethan, my grandson. Save this label."

Not acceptable:

> Automatically identifying people across all photos without consent.

## Identity Safety

Use uncertainty language:

- "This may be..."
- "I think this could be..."
- "I am not fully sure..."
- "The image is blurry, so I may be wrong."

Avoid:

- "This is definitely..."
- "I know this person is..."
- "Your grandson is..."

Unless confidence is high and user-labeled context exists.

## Emotional Safety

Do not infer sensitive emotions or relationships too strongly.

Avoid:

- "They are sad because..."
- "They are angry at you..."
- "This person looks sick..."

Better:

- "The mood appears quiet."
- "The person is not smiling."
- "I cannot tell how they are feeling for sure."

## Reply Safety

Replies must require user confirmation.

Never auto-send.

Reply drafts should be:

- Warm
- Short
- Respectful
- Editable
- Easy to cancel

## Safety Checklist

- [ ] No default photo storage
- [ ] Family labels are opt-in
- [ ] Delete option exists
- [ ] Uncertainty wording appears
- [ ] No hidden chain-of-thought shown
- [ ] Replies require confirmation
- [ ] Works with screen reader
- [ ] Main flow works without visual guidance
