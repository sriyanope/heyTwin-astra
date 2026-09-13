# Environment Variables

## Frontend

Create:

```bash
frontend/.env.local
```

Template:

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

Rules:

- Only public values may use `NEXT_PUBLIC_`.
- Do not place Agnes API keys in frontend code.
- Do not commit `.env.local`.

## Backend

Create:

```bash
backend/.env
```

Template:

```bash
PORT=8000
ENVIRONMENT=development

AGNES_API_KEY=your_agnes_api_key_here
AGNES_BASE_URL=your_agnes_base_url_here

USE_SAMPLE_FALLBACK=true
STORE_IMAGES_BY_DEFAULT=false
```

Rules:

- Do not commit real secrets.
- Keep `.env.example` dummy-only.
- Backend owns all private API keys.
- Demo fallback should be clearly marked.

## Required Variables

| Variable | Where | Required | Description |
|---|---|---:|---|
| `NEXT_PUBLIC_BACKEND_URL` | Frontend | Yes | Backend API base URL |
| `AGNES_API_KEY` | Backend | Yes | Agnes AI API key |
| `AGNES_BASE_URL` | Backend | Yes/No | Agnes API base URL if needed |
| `USE_SAMPLE_FALLBACK` | Backend | Yes | Allows demo fallback |
| `STORE_IMAGES_BY_DEFAULT` | Backend | Yes | Must default to false |

## Local Setup

```bash
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```
