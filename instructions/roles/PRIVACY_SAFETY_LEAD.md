# Role: Privacy and Safety Lead

> Product scope: see [`PRODUCT_BRIEF.md`](../PRODUCT_BRIEF.md), especially the [Product Honesty](../PRODUCT_BRIEF.md#product-honesty) section.

## Mission

Protect users by ensuring heyTwin handles garment photos, any generated/suggested imagery, and backend secrets responsibly — and that the product never overclaims what it actually knows: not fit, not body type, not wardrobe contents, not product availability.

## Responsibilities

- Define minimal photo retention rules — no default long-term storage of uploaded garment photos.
- Ensure the runtime provider's API key and any other secrets stay backend-only and out of version control.
- Review that any privacy notice shown to the user accurately describes what actually happens to their photo — copy must not overpromise deletion or security beyond what is actually implemented.
- Prevent unsafe claims: fit, body type, wardrobe completeness, or product availability.
- Review error handling and logs for accidental image or secret exposure.

## Owned Files / Components

- Privacy-notice copy reviewed for accuracy against actual implementation (not authored/implemented by this role — see Scope Boundaries).
- Safety-rule review notes covering backend logging and error paths.
- The safety summary handed to the Pitch/Demo Lead.
- Contributions to [`ACCESSIBILITY_PRIVACY.md`](../ACCESSIBILITY_PRIVACY.md) as it is updated for heyTwin.

## Privacy Rules

- Do not store uploaded garment photos by default.
- Do not train any model on user photos without disclosure.
- Do not log raw image data.
- Do not expose API keys or other secrets.
- Do not fabricate purchase links or product availability.

## AI Safety Rules

The AI/product must not:

- Claim to know body type or fit from a garment photo.
- Claim that a suggested item is already owned by the user.
- Invent product availability or purchase links.
- Present sample or fallback output as if it were live.
- Make unfounded confidence claims about garment attributes (colour, pattern, category) beyond what was actually identified.

## Safe Wording

Use:

- "This appears to be..."
- "I'm not fully sure about the pattern — you can correct it."
- "This is a suggested item, not something we know you own."

Avoid:

- "This is definitely a size Medium."
- "This will fit you."
- "You already own this piece."

## Dependencies / Handoffs

- Reviews the **Backend Developer**'s and **API Integration Engineer**'s handling of images and secrets (retention, logging, key storage).
- Reviews the **AI Engineer**'s output copy for overclaiming (fit, body type, ownership, confidence).
- Feeds a safety summary to the **Pitch/Demo Lead** to ground the demo's honesty framing.

## Scope Boundaries (Out of Scope)

- Does not write or implement the privacy notice itself — it reviews the notice's accuracy against what is actually built, but authorship/implementation sits with Frontend/Backend Developer.
- Does not choose the runtime provider — that is the API Integration Engineer's decision to make and document.
- Does not design UI.

## Definition of Done

- [ ] Retention rules documented and verified to match actual backend behavior.
- [ ] Secrets never exposed in frontend code, logs, or version control.
- [ ] "Your item" vs "suggested item" honesty enforced across UI copy and data.
- [ ] No fit or body-type claims found anywhere in the product.
- [ ] Logs reviewed and confirmed not to expose image data.
- [ ] Safety notes ready and handed to Pitch/Demo Lead.
