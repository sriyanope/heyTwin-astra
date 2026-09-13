# Role: Agnes API Integration Engineer

## Mission

Own the technical integration between FamLens and Agnes AI API.

## Responsibilities

- Set up Agnes API client
- Manage authentication securely
- Create reusable API wrapper
- Handle retries and errors
- Support image input format required by Agnes
- Normalize Agnes responses
- Add fallback behavior
- Document API usage

## Integration Requirements

- Agnes API key must stay in backend `.env`
- Frontend must never call Agnes directly
- API wrapper should expose simple methods:
  - `analyzeImage`
  - `extractText`
  - `answerImageQuestion`
  - `generateReply`

## Error Handling

Handle:

- Missing API key
- Invalid image format
- Rate limits
- Timeout
- Model unavailable
- Unexpected response shape

## Fallback Rules

If Agnes API fails:

- Return sample fallback response
- Set `source_state: "sample"` or `"fallback"`
- Include user-facing warning
- Keep demo running

## Definition of Done

- [ ] Agnes client wrapper exists
- [ ] API key is environment-based
- [ ] Image analysis call works
- [ ] Error handling works
- [ ] Fallback works
- [ ] API usage documented
