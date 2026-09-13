# Role: AI Engineer

## Mission

Design the AI workflow that turns images into elder-friendly, personal, and trustworthy descriptions.

## Responsibilities

- Define Agnes AI prompt strategy
- Structure multimodal pipeline
- Create output schemas
- Tune prompts for simple elder-friendly language
- Add OCR-specific prompting
- Add uncertainty handling
- Add follow-up Q&A behavior
- Add reply generation behavior
- Prevent hallucinated identity or relationships

## AI Pipeline

```text
Image
  -> Scene understanding
  -> OCR text extraction
  -> Optional family context
  -> Short summary
  -> Detailed description
  -> Follow-up Q&A
  -> Reply generation
```

## Prompting Rules

The AI should:

- Use simple language
- Give short summary first
- Mention visible evidence
- Communicate uncertainty
- Avoid overclaiming identity
- Avoid sensitive emotional assumptions
- Avoid hidden chain-of-thought
- Generate warm replies only after user asks

## Output Requirements

Every analysis should include:

- Short summary
- Detailed description
- Detected text
- People count if visible
- Mood/context
- Confidence score
- Uncertainty note
- Suggested follow-up questions

## Safety Examples

Instead of:

> "This is your grandson Ethan."

Use:

> "This may be your grandson Ethan, but I am not fully sure."

Instead of:

> "Everyone is happy."

Use:

> "The moment appears cheerful because several people are smiling."

## Definition of Done

- [ ] Prompt returns structured JSON
- [ ] Summary is elder-friendly
- [ ] OCR works on sample image
- [ ] Follow-up Q&A avoids hallucination
- [ ] Reply generation is warm and short
- [ ] Uncertainty handling is consistent
