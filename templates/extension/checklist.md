# Production checklist

Track go-live gates and record decisions. The agent appends to the decision log after each skill.

<!-- vybekiit:generated:start production-gates -->
## Before you go live

- [ ] Sign-in works with real accounts
- [ ] `pnpm verify` passes
- [ ] Doctor reports all tools ready
- [ ] Visitor stats record a test event (when analytics is enabled)
- [ ] Error alerts received a test event (when Sentry is enabled)
- [ ] Extension talks to live backend URL
- [ ] Extension loads in Chrome Developer Mode
<!-- vybekiit:generated:end production-gates -->

## Decision log

<!-- Agent appends dated entries below — never delete -->

