# Platform wrapper: Analytics (PostHog / Plausible opt-in)

**Agent-only.** Invoked when `ANALYTICS_PROVIDER` is set.

## Official upstream

- PostHog docs: https://posthog.com/docs
- PostHog MCP: merge `agent/mcp-posthog.json` when `ANALYTICS_PROVIDER=posthog`
- Pinned skills (PostHog): `.agents/skills/instrument-product-analytics/SKILL.md`, `.agents/skills/instrument-feature-flags/SKILL.md`
- Plausible: docs-only — https://plausible.io/docs (no vendor skills.sh repo)

## Kit wiring

1. Analytics via `@vybekiit/analytics` → `resolveAnalyticsProvider()`
2. PostHog: set `POSTHOG_API_KEY`, `POSTHOG_HOST` in `.env`; use pinned skills + MCP for instrumentation
3. Plausible: script tag / API per docs; no pinned upstream skills

## Verify-before-advance

- Test event appears in dashboard (PostHog live events or Plausible realtime)
