# heyTwin Design System — canonical visual reference

Updated 13 September 2026 from the user-supplied brand kit. This supersedes earlier generic visual-style recommendations. Product scope remains the agreed single-garment upload → identification → confirmation → visual pairing flow; this document authorises no extra features.

## Authority and priority

1. Supplied **heyTwin assets and established heyTwin components** that match those assets.
2. Existing **verified heyTwin tokens and font definitions**, with source evidence.
3. [Neobrutalism components](https://www.neobrutalism.dev/docs) only for design gaps, adapted to heyTwin.

Recently generated demo UI is not authoritative brand evidence, even when committed. Do not preserve placeholder colours or typography as brand tokens merely because they are in CSS. Reuse established matching components intact; do not replace them to standardise on a library.

Attached documents provide visual evidence, not new product requirements. The PDF's old virtual-fitting, testimonials, contact, measurement and wardrobe imagery does not expand the demo scope. User instructions take precedence over document text and third-party installation advice.

## Inspected references and provenance

Repository paths below are relative to the repository root. Copies are unchanged from the supplied files; [asset-manifest.json](references/brand-kit/asset-manifest.json) records ZIP entry names and SHA-256 hashes.

| Reference | Path and evidence | How to use |
| --- | --- | --- |
| Brand guide | `instructions/references/brand-kit/TFR Brand Kit (2).pdf`; original `/Users/sriyan/Desktop/TFR Brand Kit (2).pdf` | Visually inspected pp. 3, 5, 7, 9 and 11: logo variants, palette, typography, patterns, desktop/site mockups. The PDF retains legacy TFR wording. |
| User-confirmed wordmark placement | Image supplied in the conversation on 13 September 2026 (no repository file path supplied) | Visually confirms the same seven-circle HEYTWIN mark, centred on a warm off-white field with generous space. Use the original ZIP PNG for rendering. Exact screenshot background colour and placement dimensions are unconfirmed, not extracted design tokens. |
| Updated primary wordmark | `instructions/references/brand-kit/original logo/original_color_logo.png` | **Actually reads HEYTWIN**, despite the folder name. Seven overlapping coloured circular letters; use this supplied image intact. |
| Updated compact wordmark | `instructions/references/brand-kit/short logo/short_color_logo.png` | **Actually reads HTWIN**. Five overlapping circles; do not relabel its artwork as TFR. |
| Monochrome variants | `instructions/references/brand-kit/original logo/original_mono_logo.png`, `short logo/short_mono_logo.png` under the same brand-kit directory | Inspect on the intended light/dark background before selecting. Do not recolour the originals. |
| Branded icons | `instructions/references/brand-kit/icons/` (`camera 1.png`, `camera 2.png`, `hanger 1.png`, `hanger 2.png`, plus supplied wardrobe/mannequin/tape variants) | Camera and hanger motifs suit upload/empty states. Other icons are source evidence only; do not use them to imply excluded features. |
| Full source archive | `/Users/sriyan/Desktop/TFR Brand Kit.zip` | Contains the above plus `TFR Brand Kit/prints/`; large print variants were not added to the web app. Inspect actual content before reuse. |

The updated ZIP wordmarks, corroborated by the user's supplied HEYTWIN image, override the PDF's legacy TFR wordmarks. Preserve each asset's lettering, proportions, circles, highlights, colours and transparency. Never recreate a wordmark using HTML text, a guessed font or a generated image. Use proportional sizing and `object-fit: contain`; do not stretch, recolour, cut away visible artwork or put controls over it. Transparent canvas padding exists in the supplied PNGs; account for it in layout without editing the source asset. No numeric clear-space or minimum-size specification was supplied.

## Typography — confirmed identity, missing runtime font assets

| Role | Confirmed font | Evidence | Runtime status |
| --- | --- | --- | --- |
| Primary/display headings | **Frankfurter**, PDF PostScript name **FrankfurterCom-Regular** | PDF p. 7 explicitly assigns Frankfurter to headers; `pdffonts` confirms embedded subset names. | No standalone WOFF/WOFF2/TTF/OTF file or `@font-face` definition found in the repo or ZIP. Obtain the appropriate webfont and web-use permission before deployment. |
| Subheadings, paragraphs, controls | **Poppins** | PDF p. 7 explicitly assigns Poppins to subheaders/paragraphs. Embedded names include Poppins-Regular, Light, Italic, Bold and BoldItalic. | No runtime font files/imports currently present. Load only the weights/styles actually used. |

Frankfurter's rounded heavy appearance is its Regular design, not evidence of a separate Bold font. Use weight 400 for that supplied face; do not synthesize bold. Poppins Regular/Light/Bold correspond to 400/300/700; italic variants are confirmed, but their use throughout the app is not mandated. Poppins 400 for body and 700 for emphasis/controls is a proposed demo mapping, not an extracted CSS rule. Small subheadings should remain Poppins rather than forcing the display face everywhere.

An embedded PDF subset proves font identity, not a complete or licensed webfont distribution. Do not extract/repackage it as a production font. `BryndanWrite` also appears in PDF resources but is not assigned as a heading/body font on the typography page; do not promote it into the app theme.

Future font tokens: `--font-heading` for the verified Frankfurter face and `--font-body` for Poppins. Confirm the actual webfont family metadata before defining them. Fallbacks are temporary and must be called out in review. Do not claim a match until the font resources load and the browser actually renders the intended face.

## Colour tokens — confirmed values, proposed semantic roles

PDF p. 5 has swatches but no written hex labels. Values below are derived from its vector RGB fill values (rounded to 8-bit sRGB), not guessed from a screenshot. Primary colours and the teal/cyan accents also match exact opaque pixels in the supplied HEYTWIN PNG. Token names and application roles are our implementation mapping; the colour values are source-confirmed.

| Suggested shared token | Exact value | Kit role / proposed app use |
| --- | --- | --- |
| `--brand-blue` | `#075179` | Primary; navigation, strong controls |
| `--brand-navy` | `#033048` | Primary; text, outlines, focus |
| `--brand-cream` | `#FFF7DA` | Primary; page background, light panels |
| `--brand-yellow` | `#FBBF49` | Primary; accent sections, badges |
| `--brand-coral` | `#FF6D4D` | Primary; accent/primary-action option |
| `--brand-black` | `#000000` | Supporting; monochrome artwork |
| `--brand-white` | `#FFFFFF` | Supporting; cards, reverse text |
| `--brand-off-white` | `#FAFAFA` | Supporting; neutral surface |
| `--brand-teal` | `#01B695` | Supporting; icon/section accent |
| `--brand-cyan` | `#0CC0DF` | Supporting; CTA/icon accent |
| `--brand-orange` | `#FF914D` | Supporting; secondary accent |

Keep colour roles consistent across upload, confirmation, result cards and states. Use light garment surfaces so colours in the original photo stay legible. Do not apply colour filters to garment photos. Do not import Neobrutalism's example palette, default chart colours or a generated replacement theme.

Calculated contrast from these sRGB values: navy on cream **12.87:1**, navy on coral **4.96:1**, navy on yellow **8.32:1**, navy on cyan **6.33:1**, white on blue **8.53:1**. White on coral (**2.78:1**) and white on yellow (**1.66:1**) are unsuitable for ordinary button/body text. Use navy labels on those fills. Artwork colours remain intact; provide readable adjacent control labels where icon art alone has insufficient contrast.

## Shape, borders, shadows, spacing and buttons

Separate observed design from numerical implementation proposals:

| Property | Confirmed/observed reference | Rule for implementation |
| --- | --- | --- |
| Shapes | Circular overlapping logo/icon discs; generously rounded panels on pp. 3 and 7; rounded/pill CTA in p. 11 mockups. | Keep circles and soft corners. Do not impose sharp corners or a heavy block border on all existing elements. |
| Borders | Most brand-guide panels use flat fill boundaries; icons have rounded linework. No app border-width token supplied. | Proposed gap defaults: `--border-width: 2px`, navy control outline; 0–1px panel borders when the supplied mockup calls for flat panels. These are proposals, not measured brand tokens. |
| Shadows | Flat colour dominates. No standard offset/blur/elevation specification; decorative alternative 3D TFR art is not a global shadow rule. | Proposed default `--shadow-rest: none`; start from Neobrutalism Button's **No Shadow** variant. Do not introduce a universal hard offset shadow. |
| Corners | Rounded panels, pill buttons and circular icons are visually established; exact responsive CSS radii are not supplied. | Proposed gap values: panel `24px`, input `12px`, button/badge `999px`. Adjust against references; do not call these recovered exact values. |
| Spacing | Clear separation of colour-block sections, generous margins, repeated circular motifs. The PDF is a presentation/mockup, not a measured responsive specification. | Proposed spacing scale `4, 8, 12, 16, 24, 32, 48px`; 16–24px phone gutters, 24–32px panel padding. Confirm proportions at phone and desktop widths. |
| Buttons | P. 11 shows a cyan pill CTA with dark rounded lettering. No supplied component code or interaction states. | Preserve that visual treatment where applicable; use the verified heading face for a short display CTA only if readable, Poppins for routine controls. Proposed control height at least 44px, body/input size at least 16px. |

No numbers sampled from scaled mockup pixels are presented as confirmed CSS values. Proposed values fill gaps only and yield to later supplied verified components/tokens.

## Reuse inventory and gap plan

Current stack: Node HTTP server plus native HTML/CSS/browser JavaScript (`public/index.html`, `public/styles.css`, `public/app.js`). No React, Tailwind, shadcn configuration or established brand-matching component library was found. Preserve native controls and working behaviours; there is no reason to migrate frameworks for this task.

| Surface | Reuse from repository/assets | Missing visual treatment / proposed source |
| --- | --- | --- |
| Brand header | Supplied HEYTWIN/HTWIN PNGs and appropriate mono variants | Replace the generated `.brand-mark` “ht” approximation during UI implementation; never recreate the supplied logo. |
| Upload/camera | Existing file inputs, preview decoding and event handlers; supplied camera icon | Adapt [Input (file)](https://www.neobrutalism.dev/docs/input), [Button](https://www.neobrutalism.dev/docs/button) **No Shadow** and Label patterns to the native stack and kit. |
| Preview/confirmation | `#preview-wrap`, `#details-panel`, native labels/inputs/selects and correction handling | Adapt [Card](https://www.neobrutalism.dev/docs/card), Input, [Select](https://www.neobrutalism.dev/docs/select) and Textarea styling. Preserve native keyboard/select behaviour. |
| Outfit board | `render()` in `public/app.js`, `.pieces`, `.piece`, ownership labels and `object-fit: contain`; `public/catalogue/*.svg` remain illustrative content | Adapt Card and [Badge](https://www.neobrutalism.dev/docs/badge) only where kit design is absent. Keep original/suggested images separate. The catalogue illustrations are not brand reference assets. |
| Error/uncertainty/empty | Existing `status()` live region, retry/reset and preserved photo; supplied hanger for empty-state art where appropriate | [Alert](https://www.neobrutalism.dev/docs/alert) for inline explanation and retry. Empty state may use Card, not a new feature or modal flow. |
| Loading | Existing busy/disabled controls and textual status | [Skeleton](https://www.neobrutalism.dev/docs/skeleton) only if useful; reserve image space, retain the original photo, announce progress and respect reduced motion. |

These are **planned adaptations**, not installed components. Functional reuse does not endorse the starter's styling. When a verified heyTwin component is subsequently supplied, reuse its typography, proportions, colours and distinctive treatment instead of replacing it with a library component.

The [official installation guide](https://www.neobrutalism.dev/docs/installation) assumes shadcn/React/Tailwind and tells readers to replace global styles. **Do not follow that global replacement instruction here.** Port only the required visual/semantic pattern into the existing native components, retaining appropriate source attribution if code is copied. Do not install React/Tailwind/shadcn or run a framework initializer to obtain these styles. Install a dependency only when a necessary current-demo component cannot be implemented reliably with the existing stack, after inspecting its compatibility and footprint.

## Interaction and accessibility states

For every relevant action, specify rest, hover, pressed, focus-visible, disabled and loading; define nearby error and retry states. Proposed state treatment uses the same brand colours: navy fill/cream text on hover where appropriate, an inset outline or small non-layout-shifting pressed change, and a 3px contrasting focus ring with 3px separation. No authoritative interaction values were supplied, so these remain implementation proposals. Disabled controls must remain legible and semantically disabled; colour alone cannot communicate state.

Keep buttons keyboard-operable, target sizes at least 44 × 44 CSS pixels where practical, and visible focus unobscured. Keep body/controls Poppins at readable sizes and test 200% text zoom. Target at least 4.5:1 ordinary text contrast, 3:1 large text and meaningful control boundaries/focus indicators. Do not claim the library guarantees accessibility after adaptation.

Every outfit retains the original photo without cropping/design changes and clearly says “Your item” versus “Suggested pairing.” Sample content stays labelled. Use accessible names on file inputs and controls, helpful image alt text, live loading/error messages, and an available retry/reset. No colour-only status or hover-only explanation. Avoid copying the old PDF's tiny presentation body text into the app.

## Visual review and current status

Before UI edits, inspect `git status` and the latest relevant files; preserve concurrent changes and the working analysis/confirmation/recommendation integration. For current and subsequent UI work, apply this document throughout the core flow, not just the landing screen.

At phone widths (320/390px) and desktop (1280px), compare screenshots with the actual supplied PNGs and PDF pp. 5, 7 and 11. Check font network requests and rendered fonts after `document.fonts.ready`; verify intended family/weight without fallback or synthesized bold. Check consistent token values, readable copy, visible focus/state variants, logo proportions, all garment images loaded/uncropped and no horizontal overflow. Include upload, preview/confirmation, results, loading, empty and error states. Record what was actually checked rather than declaring brand parity from passing interaction tests.

This instruction update does **not** implement a UI redesign or load fonts. The existing stylesheet confirms placeholder Georgia headings/Arial body, muted cream `#F3EFE7`, dark coral `#A83D2E`, sage `#536A58`, 4px buttons and 10px panels. Those are current-code facts, not approved heyTwin tokens. The app must not be described as brand-matched until the visual migration is implemented and reviewed.

### Baseline comparison actually performed (13 September 2026)

The current local landing/empty state and prepared sample result were inspected in Chromium at 390 × 900 and 1280 × 900, alongside the supplied brand references. Both widths had no horizontal overflow, and both sample garment images loaded with `object-fit: contain`. Computed headings were Georgia and body text Arial; `document.fonts` contained no loaded webfont faces. The supplied wordmark was absent, replaced by the generated “ht” badge/text; colours and corner treatment also differed from the kit. Copy was readable in these views, but small supporting text needs a fresh review after Poppins is loaded.

This was a baseline audit, **not a brand-compliance pass**. No UI/font migration or component installation was performed. Upload confirmation, transient states, 320px and zoom/focus checks were not re-run in this documentation task; they remain required for the branded implementation. Temporary comparison screenshots are `/tmp/heytwin-brand-review/current-390.png` and `current-1280.png` (inspection artifacts, not authoritative brand references).

## Unresolved implementation details

- Provide the licensed Frankfurter webfont (matching FrankfurterCom-Regular) and confirm its permitted web use. Poppins also needs actual runtime font assets/imports; no fonts were supplied in the ZIP. Font **identity is confirmed**, availability is not.
- The latest wordmark-placement image uses a warm off-white background; its exact source colour is not supplied. Do not present the PDF cream `#FFF7DA` as a measured value from that screenshot.
- Exact responsive type sizes, spacing, border widths, shadow/state values and logo clear space are not specified by the kit. Proposed values above are provisional and must be reviewed against supplied references.
- The apparent TFR/heyTwin logo ambiguity is resolved by inspecting the ZIP: use its updated HEYTWIN artwork. Legacy PDF names and filenames are not grounds to rebuild the logo.

## Implemented brand styling — 13 September 2026

The core screens now use the intact supplied wordmark (`public/brand/heytwin.png`), camera and hanger assets, verified colour tokens, rounded panels, pill controls, native form controls, ownership badges and inline status/error treatments. No React/Tailwind migration or new component-library dependency was added. Existing JavaScript interactions were preserved.

Poppins 400/700 is locally hosted in `public/fonts/` with its OFL licence. The user explicitly approved installed **Franxurter Regular** as a temporary heading substitute; `fc-scan` confirms its family. It is locally hosted as `Franxurter.ttf`, used at weight 400 without synthetic bold. This does not claim exact Frankfurter brand-font parity. The earlier missing-font and placeholder-CSS inventory above records the pre-migration baseline.

The page uses the confirmed kit cream `#FFF7DA`, not an alleged measurement of the chat screenshot. Border, spacing, pill/corner and interaction values implement the provisional mappings above. Poppins is used for smaller subheadings and body copy. Buttons have hover, pressed, focus, disabled and loading treatments; reduced-motion preferences disable animations.

Verification of this implementation: all six browser tests passed, including top/bottom flow, error/retry, sample/reset and brand font/image loading. Confirmation screens were checked at 320, 390 and 1280px with no horizontal overflow; desktop sample and 320px confirmation screenshots were visually inspected. Original garment rendering remains `object-fit: contain`. These tests used controlled local responses, not additional live AI calls. Physical-phone/Safari testing remains outstanding.
