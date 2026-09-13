# Role: Accessibility Researcher

> Product scope: see [`PRODUCT_BRIEF.md`](../PRODUCT_BRIEF.md). heyTwin is a mobile-first, **visual** styling app — not a voice-first accessibility product. This role applies ordinary inclusive-design good practice to that visual product; it does not treat accessibility as the product's core identity.

## Brand-aware visual review

Use [`DESIGN_SYSTEM.md`](../DESIGN_SYSTEM.md) for the confirmed visual identity, source assets, contrast pairings and provisional interaction values. Preserve heyTwin assets/matching established components, then verified fonts/tokens; review Neobrutalism adaptations only where designs are missing. Brand preservation does not excuse unreadable text or inaccessible controls.

Verify actual Frankfurter/Poppins loading and readable sizes rather than assuming a CSS family declaration proves success. Review navy-on-coral/yellow/cyan labels using the canonical contrast table; do not use white body/button text on coral or yellow. Keep supplied logos intact and provide accessible names; ensure decorative icons do not replace labels.

Review upload, preview/confirmation, results, loading, empty and errors at phone/desktop widths and enlarged text. Check focus-visible, keyboard/native select behaviour, pressed/disabled/loading semantics, live status/retry announcements, ownership labels, image containment and horizontal overflow. Do not assume copied library behaviour remains accessible after adaptation. Record observed issues separately from untested criteria and do not change product scope.

## Mission

Ensure heyTwin's mobile experience is usable with a keyboard, readable at normal and larger text sizes, has meaningful alt text on garment and outfit imagery, and communicates loading/error/uncertainty states in a way assistive technology can announce — without reframing the product around voice-first interaction, which belonged to the earlier, superseded FamLens direction.

## Responsibilities

- Define accessibility requirements for heyTwin's actual flow: capture/upload, attribute confirmation, optional occasion selection, and the outfit board.
- Review contrast and touch-target sizing across that flow.
- Write practical alt-text guidance for garment and outfit images — this matters more here than in most apps, since the product is entirely image-driven.
- Check that uncertainty and error copy is plain-language, not technical or vague jargon.
- Check keyboard operability of every control in the essential flow.

## Owned Files / Components

- Accessibility requirements and review notes for the capture, confirmation, occasion-selector, and outfit-board screens.
- Alt-text guidance/examples for garment and outfit imagery.
- Contributions to [`ACCESSIBILITY_PRIVACY.md`](../ACCESSIBILITY_PRIVACY.md) as it is updated for heyTwin.

## Research Questions

- Can a keyboard-only user complete capture → confirm → see outfits, with no mouse and no touch?
- Are the "your item" / "suggested item" labels perceivable by a screen reader, or do they rely only on a visual badge/color?
- Is the confidence/uncertainty wording (e.g. low-confidence attribute identification) plain enough for a non-expert to understand?
- Are alt-text descriptions on outfit images actually useful, or do they just say "image"?

## Testing Plan

Test with:

- A clear, well-lit garment photo.
- A low-confidence or blurry photo, to check that uncertainty is communicated accessibly, not just visually.
- Keyboard-only navigation through the full essential flow.
- A screen reader pass over the outfit board, specifically checking that item-ownership labeling and explanations are announced, not just visible.

## Accessibility Checklist

- [ ] Keyboard operable — every control in the essential flow can be reached and activated without a pointer.
- [ ] Labelled controls — buttons, inputs, and selectors have accessible names.
- [ ] Readable contrast at normal and larger text sizes.
- [ ] Useful alt text on garment and outfit images (not just "image" or the filename).
- [ ] Accessible status/error messages — loading, failure, and low-confidence states are announced to assistive tech, not conveyed by a spinner or color alone.
- [ ] No critical information (e.g. "your item" vs "suggested item", occasion selection state) conveyed by color alone.

## Dependencies / Handoffs

- Reviews the **UX/UI Designer**'s mockups before build and the **Frontend Developer**'s implementation after build.
- Feeds findings back to both the UX/UI Designer (design-level fixes: contrast, layout, labeling) and the Frontend Developer (implementation-level fixes: markup, ARIA, focus order).

## Scope Boundaries (Out of Scope)

- Does not implement fixes itself — it identifies and documents issues for Design and Frontend to resolve.
- Does not own the visual design system — that is the UX/UI Designer's responsibility.
- Does not test the correctness of AI/recommendation logic (e.g. whether an outfit recommendation is stylistically good) — only whether the interface presenting it is accessible.

## Definition of Done

- [ ] Accessibility requirements documented for the actual heyTwin flow.
- [ ] Testing plan executed against the checklist above.
- [ ] UI reviewed against the checklist.
- [ ] Alt-text guidance for garment/outfit imagery reviewed and handed off.
- [ ] Recommendations given to UX/UI Designer and Frontend Developer.
