# Production checklist

Track go-live gates and record decisions. The agent appends to the decision log after each skill.

<!-- vybekiit:generated:start production-gates -->
## Before you go live

- [ ] Sign-in works with real accounts
- [ ] `pnpm verify` passes
- [ ] Doctor reports all tools ready
- [ ] Visitor stats record a test event (when analytics is enabled)
- [ ] Error alerts received a test event (when Sentry is enabled)
- [ ] Payments tested (practice then live)
- [ ] App is live at a public URL
- [ ] Safety check skill completed
<!-- vybekiit:generated:end production-gates -->

## Decision log

<!-- Agent appends dated entries below — never delete -->
