# Frontend Guide

> Product scope lives in [`PRODUCT_BRIEF.md`](PRODUCT_BRIEF.md). This document only covers frontend structure and conventions for heyTwin.

## Framework

Recommended frontend: **Next.js App Router** or **React**, built mobile-first.

## Main UI Surface

The primary interface is a **mobile-first visual garment-to-outfit workspace**.

The app should not feel like a shopping catalogue or a generic chatbot. It should feel like a fast, confident styling assistant: photograph one garment, confirm what it sees, and get a small set of outfits built around that exact item. Visual clarity of the garment and the suggested outfits is the priority — this is not a voice-first product, and no spoken-interaction requirements apply.

## Main Screens

### 1. Home / Capture Screen

Elements:

- Large title
- Large "Add your item" action (take photo or upload)
- Optional "Use sample photo" button, clearly labeled as a sample if shown
- Brief one-line explanation of what happens next

### 2. Garment Confirmation Screen

Elements:

- Photo of the uploaded garment
- Identified category, colour, and pattern, each with a confidence indicator
- Controls to correct any attribute that was identified wrong
- Optional occasion selector: *casual*, *work*, *going out*
- Primary action to continue to outfit recommendations (disabled until the user has had a chance to confirm/correct)

### 3. Outfit Results Screen

Elements:

- Up to 3 outfit cards, each showing:
  - The user's uploaded garment, clearly labeled **"Your item"**
  - Suggested complementary piece(s), clearly labeled **"Suggested item"**
  - A short plain-language explanation of why the combination works
- Loading state while outfits are generating
- Partial-result state (e.g. first outfit card ready while others are still generating)
- Empty state if no outfits could be generated
- Error state with a retry action

### 4. Refinement Screen/Action *(prioritised addition — build only if time remains)*

Elements:

- One simple refinement control per outfit, e.g. "Make it more casual" or "Change the shoes"
- Refined result replaces or supplements the existing outfit card, clearly re-labeled if garments change

### 5. Saved Favorites Screen *(prioritised addition — build only if time remains)*

Elements:

- List of favorited outfits, stored **locally only** (no account/auth required)
- Remove-from-favorites control
- Clear indication that favorites are local to this device

## Accessibility Rules

Ordinary good-practice UI accessibility applies. This is not a voice-first product, so there are no spoken-output or audio-control requirements.

- High contrast text and controls
- Legible text size, no dense small print
- Adequate touch target size on mobile
- Clear, descriptive labels on all interactive controls (upload button, confirm/correct controls, occasion selector, outfit cards)
- Screen-reader-friendly labels and alt text on garment and outfit images
- Keyboard navigable where relevant (mobile web still benefits from focus order and visible focus states)
- No gesture-only or hover-only controls
- No time-limited interactions without a way to continue

## Environment Variables

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

Do not place backend/vision-provider API keys (e.g. a placeholder like `VISION_MODEL_API_KEY` — confirm the exact name against [`ENVIRONMENT.md`](ENVIRONMENT.md) once it is updated for heyTwin) in frontend code. The runtime AI provider is unverified/TBD; do not hardcode or name a specific vendor in frontend code or copy.

## Data Fetching

Use standard `fetch()` for endpoints consistent with the essential flow (confirm exact route names against [`API_CONTRACTS.md`](API_CONTRACTS.md) once it is updated for heyTwin):

- `/api/analyze-garment`
- `/api/confirm-garment`
- `/api/recommend-outfits`
- `/api/refine-outfit` (prioritised addition)

## Required UI States

Every async flow should handle:

- Loading
- Empty (no garment selected yet / no outfits returned)
- Partial (e.g. first outfit ready before the others)
- Success
- Low-confidence identification
- Error
- Sample/fallback content (clearly labeled, never presented as live)

## Component Structure

Recommended:

```text
frontend/
  app/
    page.tsx
    confirm/
    outfits/
    favorites/
  components/
    CapturePanel.tsx
    GarmentConfirmCard.tsx
    OccasionSelector.tsx
    OutfitCard.tsx
    ItemBadge.tsx
    ExplanationText.tsx
    ConfidenceNote.tsx
    RefinementControls.tsx
    FavoriteButton.tsx
  lib/
    api.ts
    types.ts
```

`ItemBadge` renders the "Your item" / "Suggested item" distinction and must appear on every garment shown in an outfit card — see the product-honesty rule in [`PRODUCT_BRIEF.md`](PRODUCT_BRIEF.md).

## Do Not Add Unless Approved

- Full wardrobe upload/onboarding flows
- Retailer checkout, purchase, or live shopping links
- Body measurement or body-scan input
- Fit or size-prediction claims in the UI
- Heavy 3D/avatar visualization or virtual try-on
- Unnecessary authentication flows
- Automatic purchase-link generation
- Complex dashboard UI or heavy animation libraries unrelated to the core flow
