# CLAUDE.md

This file is the source of truth for **heyTwin**'s AI workflow and product behavior. It mirrors, in fuller technical detail, what [`AGENTS.md`](AGENTS.md) summarizes. Scope itself lives in [`PRODUCT_BRIEF.md`](PRODUCT_BRIEF.md); if this file and `PRODUCT_BRIEF.md` disagree about *what we are building*, `PRODUCT_BRIEF.md` wins.

## Product Summary

heyTwin takes a photo of one top or bottom the user already owns and shows visual outfit recommendations built around it, each with a short explanation of why it works.

The product should help users feel:

- Confident
- Understood
- In control of their own wardrobe choices
- Pleasantly surprised by a combination they hadn't considered

The product should not feel:

- Like a shopping/retail funnel
- Like a body-image or fit/sizing tool
- Like a generic "AI fashion chatbot"
- Like a tool that guesses with false certainty about a garment or a fit

## Main Demo Flow

1. User photographs or uploads one top or bottom.
2. heyTwin identifies the garment's visible attributes.
3. User confirms or corrects the identified attributes.
4. User optionally selects an occasion: casual, work, or going out.
5. heyTwin generates outfit recommendations built around the garment.
6. heyTwin presents the outfits visually, with the user's garment clearly identifiable in each one.
7. heyTwin explains, in plain language, why each combination works.

## AI Pipeline

### Stage 1: Garment Intake

Goal: Accept a photo of one top or bottom.

Input:

```json
{
  "image": "file or base64 reference",
  "garment_hint": "top | bottom | unknown"
}
```

Output:

```json
{
  "garment_id": "string",
  "status": "accepted"
}
```

### Stage 2: Attribute Identification

Goal: Identify the garment's visible attributes.

Output:

```json
{
  "garment_id": "string",
  "category": "top | bottom",
  "subcategory": "e.g. blouse, jeans, skirt",
  "colour": "string",
  "pattern": "solid | striped | floral | plaid | other",
  "other_attributes": {
    "sleeve_length": "string | null",
    "material_impression": "string | null"
  },
  "confidence": 0.0,
  "source_state": "live | cache | sample | fallback"
}
```

### Stage 3: User Confirmation / Correction

Goal: Let the user correct obvious identification mistakes before recommendations are generated. This step is mandatory and must not be skipped even when confidence is high.

Input (user-submitted correction):

```json
{
  "garment_id": "string",
  "confirmed_category": "top | bottom",
  "confirmed_colour": "string",
  "confirmed_pattern": "string",
  "user_edited": true
}
```

Output:

```json
{
  "garment_id": "string",
  "status": "confirmed"
}
```

Rules:

- Do not generate outfit recommendations before this step completes.
- Never present unconfirmed attributes as final in the UI.

### Stage 4: Occasion Input (Optional)

Goal: Capture a simple occasion selection to improve relevance.

Input:

```json
{
  "garment_id": "string",
  "occasion": "casual | work | going_out | null"
}
```

### Stage 5: Outfit Recommendation Generation

Goal: Generate outfit recommendations built around the confirmed garment.

Output:

```json
{
  "garment_id": "string",
  "occasion": "casual | work | going_out | null",
  "outfits": [
    {
      "outfit_id": "string",
      "items": [
        { "role": "your_item", "ownership": "user_item", "description": "the confirmed garment" },
        { "role": "complementary_top_or_bottom", "ownership": "suggested_item", "description": "string" },
        { "role": "optional_accessory", "ownership": "suggested_item", "description": "string" }
      ],
      "confidence": 0.0
    }
  ],
  "source_state": "live | cache | sample | fallback"
}
```

Rules:

- Target three distinct outfits. If three is unstable, return one or two that always work rather than three unreliable ones.
- Every item must carry `ownership: "user_item" | "suggested_item"`.

### Stage 6: Visual Presentation

Goal: Show outfits visually with "your item" and "suggested items" clearly distinguished.

Rules:

- The user's garment must be visually identifiable in every outfit shown.
- Do not silently replace the user's garment with a different design in any generated visual.
- Label sample/cached output honestly in the UI (`source_state`).

### Stage 7: Explanation Generation

Goal: Give a short, plain-language reason each combination works.

Output:

```json
{
  "outfit_id": "string",
  "explanation": "A short, non-jargon sentence citing visible attributes of this garment.",
  "confidence": 0.0
}
```

Rules:

- Cite visible attributes of *this* garment (colour, pattern, category) rather than generic styling advice.
- Keep language understandable to a non-expert; avoid fashion jargon.

**Note:** These JSON shapes are illustrative and should stay in sync with [`API_CONTRACTS.md`](API_CONTRACTS.md) as that file is updated for heyTwin. Where the two disagree, reconcile them rather than shipping two divergent contracts.

## Source / Confidence Rules

Every AI output should include:

```json
{
  "confidence": 0.0,
  "source_state": "live | cache | sample | fallback"
}
```

Rules:

- Be honest about uncertainty in attribute identification.
- Show fallback/sample state in the demo if used.
- Do not pretend mock/cached data is live.
- Do not fabricate product availability, purchase links, or vendor/model capabilities.

## Privacy Rules

- Do not store uploaded garment photos by default; retain only what is needed to complete the current session's flow.
- Delete temporary files after processing where possible.
- Do not train models on user photos.
- Do not expose image data in logs.
- Any local "save a favourite" feature (see `PRODUCT_BRIEF.md` Prioritised Additions) should store data browser-local, not on a server, unless explicitly decided otherwise.
- Cross-check `ACCESSIBILITY_PRIVACY.md` as it is updated for heyTwin; this section should not contradict it, but implementation should not block on that file being rewritten first.

## Demo Guardrails

The demo should use safe, consented, sample garment photos. Show three cases to demonstrate confirmation-step honesty:

1. A clear, well-lit top or bottom with unambiguous colour and pattern.
2. A patterned bottom (e.g. plaid or floral) where attribute identification is more visually complex.
3. An ambiguous or poor-lighting item, to demonstrate that the confirmation step catches and corrects identification mistakes rather than presenting a wrong guess as fact.

## Verification Checklist

- [ ] Garment capture/upload works.
- [ ] Attribute identification returns category, colour, and pattern with confidence.
- [ ] User can confirm or correct identified attributes before recommendations run.
- [ ] Occasion selector works (casual / work / going out).
- [ ] At least one outfit recommendation is generated and displayed.
- [ ] "Your item" and "Suggested item" are visually distinguished on every outfit card.
- [ ] Each outfit includes a short, plain-language explanation.
- [ ] Sample/cache/fallback output is labeled honestly (`source_state`).
- [ ] Failures show a readable message and a retry, never a blank screen.
- [ ] No hidden chain-of-thought is shown.
- [ ] No secrets are committed.
