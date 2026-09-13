# Architecture Decision Records

Use this file to record major project decisions.

## ADR Template

### ADR-[Number]: [Decision Title]

**Date:** [YYYY-MM-DD]

**Status:** [Proposed / Accepted / Superseded / Deprecated]

### Context

[What problem or decision are we facing?]

### Decision

[What did we decide?]

### Alternatives Considered

- [Alternative 1]
- [Alternative 2]
- [Alternative 3]

### Consequences

Positive:

- [Positive consequence]

Tradeoff:

- [Tradeoff]

---

## ADR-001: Focus on Family Photo Conversations

**Date:** [YYYY-MM-DD]

**Status:** Accepted

### Context

The initial idea could become a broad visual assistance app. This is too wide for a hackathon MVP.

### Decision

FamLens will focus on visually impaired elderly users receiving family photos or WhatsApp-style image messages.

### Alternatives Considered

- General object detection app
- Navigation assistant
- Document reader
- Medical accessibility app

### Consequences

Positive:

- Clear emotional use case
- Stronger demo story
- Better differentiation from generic accessibility tools

Tradeoff:

- Narrower scope
- Requires careful privacy and consent design

---

## ADR-002: Voice-First Interface

**Date:** [YYYY-MM-DD]

**Status:** Accepted

### Context

The target users may not be able to rely on visual UI.

### Decision

FamLens will prioritize spoken descriptions, repeat controls, and large touch targets.

### Consequences

Positive:

- Better accessibility
- Stronger user fit

Tradeoff:

- Requires more careful audio state handling
