# Role: AI Engineer

## Mission

Define garment interpretation (attribute identification), recommendation logic, structured outputs, and grounded styling explanations for heyTwin. See [`PRODUCT_BRIEF.md`](../PRODUCT_BRIEF.md) for the essential flow and honesty rules this pipeline must satisfy.

This role is distinct from the API Integration Engineer: this role defines *what* the pipeline should produce (attributes, confidence, recommendations, explanations, ownership tagging); the API Integration Engineer confirms *whether the chosen runtime provider can actually do it*. The runtime vision/recommendation model provider is unverified/TBD — this file must not name a specific vendor, and GPT Astra is a development tool used to build the app, not assumed to be the runtime inference or image-generation provider.

## Responsibilities

- Define the attribute-identification step: category, colour, pattern, and confidence from a garment photo.
- Design for user confirmation/correction: the pipeline must accept corrected attributes back in and treat them as authoritative, even when the frontend/backend implement the actual confirmation step.
- Design the outfit-recommendation logic: target 3 outfits, every item tagged with ownership.
- Design explanation generation grounded in the specific garment's visible attributes, not generic style advice.
- Define honest uncertainty handling for low-confidence attribute reads.
- Prevent hallucinated fit, size, or body-type claims anywhere in the pipeline's outputs.

## AI Pipeline

```text
Garment image
  -> Attribute identification (category, colour, pattern, confidence)
  -> User confirmation / correction (handled by frontend/backend; pipeline must accept corrected attributes back in)
  -> Optional occasion input (casual | work | going_out)
  -> Outfit recommendation generation (target 3, ownership-tagged items)
  -> Explanation generation, grounded in the specific garment's visible attributes
```

## Prompting Rules

- Use simple, plain-language output.
- Ground explanations in the specific garment's visible attributes (colour, pattern, category), not generic styling advice.
- Communicate uncertainty honestly when confidence in an attribute read is low.
- Never infer or state body type, fit, or size from the image.
- Never claim a suggested item is already owned by the user.
- Avoid exposing hidden chain-of-thought in any output shown to the user.

## Output Requirements

Every pipeline run should produce:

- Identified attributes (category, colour, pattern, other visible attributes) with a confidence score.
- A user-facing uncertainty note when confidence is low.
- A target of 3 outfit recommendations, each with items tagged `ownership: "user_item" | "suggested_item"`.
- A short explanation per outfit, grounded in the actual garment's visible attributes.
- `source_state` (`live | cache | sample | fallback`) on every output.

## Safety Examples

Instead of:

> "This will fit you perfectly."

Use:

> "This pairing works well with the fit and colour of your top, based on what's visible in the photo."

Instead of:

> "You are a size Medium."

The AI should never estimate or state a size at all — this is not something the pipeline should attempt under any phrasing.

## Definition of Done

- [ ] Pipeline returns structured JSON
- [ ] Attribute identification includes a confidence score
- [ ] Explanations are grounded in the specific garment, not generic
- [ ] No fit or body-type claims appear anywhere in outputs
- [ ] Ownership tagging is present on every recommended item
- [ ] Uncertainty handling is consistent across low-confidence cases

## Dependencies / Handoffs

- Depends on the API Integration Engineer confirming what the chosen runtime provider can actually return (attribute detail, latency, structured-output support).
- Hands the output schema (attributes, confidence, ownership tags, explanations, source_state) to the Backend Developer for normalization and response shaping.
- Coordinates uncertainty wording (how low confidence reads on screen) with the UX/UI Designer.

## Scope Boundaries (Out of Scope for This Role)

- Does not select or contract the runtime API provider itself — that is the API Integration Engineer's job.
- Does not build the backend endpoints or handle request validation — that is the Backend Developer's job.
- Does not design the visual UI or screen layouts — that is the UX/UI Designer's job.
