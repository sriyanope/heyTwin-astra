# Environment Variables

> Product scope lives in [`PRODUCT_BRIEF.md`](PRODUCT_BRIEF.md). Provider selection is unresolved — see [`ARCHITECTURE.md`](ARCHITECTURE.md) and [`DECISIONS.md`](DECISIONS.md) ADR-004. No application code exists yet; this file describes the expected env var shape for the suggested stack, not a confirmed setup.

## Frontend

Create (suggested/example path, assumes a Next.js-style frontend — not a confirmed stack choice):

```bash
frontend/.env.local
```

Template:

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

Rules:

- Only public values may use `NEXT_PUBLIC_`.
- Do not place the runtime vision/recommendation model's API key in frontend code.
- Do not commit `.env.local`.

## Backend

Create (suggested/example path):

```bash
backend/.env
```

Template:

```bash
PORT=8000
ENVIRONMENT=development

# Runtime vision/recommendation provider — VENDOR UNVERIFIED/TBD.
# Confirm the actual provider during the first ~30 minutes of the build
# (see PRODUCT_BRIEF.md Product Risks and DECISIONS.md ADR-004).
# Astra is the AI development/coding platform used to build this app —
# it is NOT this runtime provider. Do not assume Astra credits cover
# runtime inference or image generation.
VISION_MODEL_API_KEY=your_vision_model_api_key_here
VISION_MODEL_BASE_URL=your_vision_model_base_url_here

USE_SAMPLE_FALLBACK=true
STORE_GARMENT_IMAGES_BY_DEFAULT=false
```

Rules:

- Do not commit real secrets.
- Keep `.env.example` dummy-only.
- Backend owns all private API keys.
- Demo fallback should be clearly marked (`USE_SAMPLE_FALLBACK`, `source_state` in responses).
- `STORE_GARMENT_IMAGES_BY_DEFAULT` must default to `false`, per the minimal-retention posture in [`PRODUCT_BRIEF.md`](PRODUCT_BRIEF.md) and [`ACCESSIBILITY_PRIVACY.md`](ACCESSIBILITY_PRIVACY.md).

## Required Variables

| Variable | Where | Required | Description |
|---|---|---:|---|
| `NEXT_PUBLIC_BACKEND_URL` | Frontend | Yes | Backend API base URL |
| `VISION_MODEL_API_KEY` | Backend | Yes | API key for the runtime vision/recommendation provider — **vendor unverified/TBD, confirm during the first 30 minutes of the build** |
| `VISION_MODEL_BASE_URL` | Backend | Yes/No | Base URL for the runtime provider, if needed — same TBD caveat |
| `USE_SAMPLE_FALLBACK` | Backend | Yes | Allows demo fallback |
| `STORE_GARMENT_IMAGES_BY_DEFAULT` | Backend | Yes | Must default to `false` |

## Local Setup

```bash
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```
