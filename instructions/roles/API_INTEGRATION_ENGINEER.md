# Role: API Integration Engineer

> Product scope: see [`PRODUCT_BRIEF.md`](../PRODUCT_BRIEF.md). This role owns the runtime AI provider decision — every other document intentionally leaves that provider as unverified/TBD.

## Mission

Verify runtime provider access, define the integration boundary between the backend and whatever runtime vision/recommendation model the team picks, handle failures gracefully, and document the actual — not assumed — capability constraints of that provider.

This is explicitly distinct from **GPT Astra**, which is the development platform used to build heyTwin during the hackathon, not the runtime service the deployed app calls at inference time. See [`HACKATHON_POSITIONING.md`](../HACKATHON_POSITIONING.md).

This role is time-critical: the first ~30 minutes of the 5-hour build must confirm whether the chosen runtime provider can actually do garment attribute identification and outfit recommendation, at what latency, and under what constraints. Everything else in the build depends on this answer.

## Responsibilities

- Select and test a runtime vision/recommendation provider within the first 30 minutes of the build.
- Set up the API client for that provider and manage authentication securely (backend `.env` only, never committed).
- Create a reusable wrapper exposing simple methods, e.g. `identifyGarment`, `recommendOutfits`, and optionally `refineOutfit`.
- Handle retries, timeouts, rate limits, and unexpected response shapes.
- Document the actual, verified capabilities and limits of the chosen provider: does it reliably return structured JSON? can it handle occasion-conditioned recommendations? what is real-world latency, not documentation latency?
- Add fallback behavior so a provider failure never breaks the demo.

## Owned Files / Components

- The backend's runtime-provider API client and wrapper module.
- `.env` configuration for the runtime provider's credentials (backend only).
- Written notes on the chosen provider's verified capabilities, limits, and latency — feeding [`DECISIONS.md`](../DECISIONS.md) ADR-004 and [`API_CONTRACTS.md`](../API_CONTRACTS.md).

## Integration Requirements

- The runtime provider's API key/secret must stay backend-only and must never reach frontend code or version control.
- The wrapper must expose the simple methods above rather than leaking raw provider request/response shapes into the rest of the app.
- Document whichever provider is actually chosen. Every other role file in this repo intentionally leaves the runtime provider as unverified/TBD — this role is where that gets resolved and written down.

## Error Handling

Handle:

- Missing API key
- Invalid image format
- Rate limits
- Timeout
- Model unavailable
- Unexpected response shape

## Fallback Rules

If the runtime provider fails, is too slow, or proves too limited for the essential flow:

- Return a sample fallback response.
- Set `source_state: "sample"` or `"fallback"`.
- Include an honest user-facing note that the result is not live.
- Keep the demo running rather than showing a blank screen or a hard error.

## Dependencies / Handoffs

- Hands a confirmed, documented provider integration (wrapper, capabilities, latency, limits) to the **Backend Developer** and **AI Engineer**, who build the identification/recommendation logic and the rest of the pipeline on top of it.
- Escalates to the **Product Manager** immediately if no viable provider is found within the first 30–45 minutes — this blocks the entire essential flow and may require a scope or plan change.
- Shares fallback/`source_state` behavior with **QA Tester** so failure-mode testing has something concrete to test against.

## Scope Boundaries (Out of Scope)

- Does not define the recommendation logic, prompting strategy, or attribute-identification heuristics themselves — that is the **AI Engineer**'s job. This role owns *whether and how* the provider can be called, not what is asked of it.
- Does not build UI.
- Does not decide product scope or the essential flow — that is [`PRODUCT_BRIEF.md`](../PRODUCT_BRIEF.md) and the **Product Manager**.
- Does not choose or represent Astra as the runtime provider — Astra is a development tool, not part of this integration.

## Definition of Done

- [ ] Runtime provider selected and tested within the first 30 minutes of the build.
- [ ] Capability and latency constraints documented from actual testing, not assumed from documentation.
- [ ] Wrapper client exists exposing `identifyGarment`, `recommendOutfits`, and optionally `refineOutfit`.
- [ ] API key is environment-based and never reaches frontend code or version control.
- [ ] Error handling works for all listed failure modes.
- [ ] Fallback behavior works and sets an honest `source_state`.
- [ ] Findings communicated to Backend Developer and AI Engineer.
