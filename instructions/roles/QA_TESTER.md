# Role: QA Tester

## Mission

Test FamLens end-to-end so the hackathon demo is reliable.

## Responsibilities

- Test main user flow
- Test edge cases
- Test fallback mode
- Test accessibility basics
- Report bugs clearly
- Verify demo readiness

## Test Scenarios

### Core Flow

- Upload clear image
- Receive short summary
- Play audio
- Ask follow-up
- Generate reply

### OCR Flow

- Upload image with text
- Ask what text says
- Confirm answer includes uncertainty if blurry

### Low Confidence Flow

- Upload blurry image
- Confirm app does not overclaim
- Confirm retry option appears

### API Failure

- Simulate Agnes API failure
- Confirm fallback appears
- Confirm source state shows fallback/sample

### Accessibility Flow

- Navigate with keyboard
- Use screen reader labels
- Repeat audio
- Check large buttons

## Bug Report Format

```md
## Bug Title

### Steps
1.
2.
3.

### Expected

### Actual

### Severity
Low / Medium / High / Demo-blocking

### Screenshot / Notes
```

## Definition of Done

- [ ] Happy path tested
- [ ] Edge cases tested
- [ ] Fallback tested
- [ ] Accessibility smoke test done
- [ ] Demo checklist passed
