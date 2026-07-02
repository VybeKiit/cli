---
name: harden
description: the builder's app is protected against the common attacks every app faces — someone. Use when the builder says something like: lock down; make it safe; protect from abuse.
metadata:
  vybekiit-generated: buyer-skill-stub
---

<!-- vybekiit:generated:buyer-skill-stub -->

# Skill: harden

**Goal:** the builder's app is protected against the common attacks every app faces — someone
hammering the login to guess passwords, bots flooding requests, and other sites secretly making
requests on a visitor's behalf. By the end, protection is on and confirmed, in plain words.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate. You do all the work; the builder just approves.

> **Good news to lead with:** their app already ships protected — this skill confirms it, tunes it to
> their app, and (at go-live) extends it to the edge. Don't alarm them; frame it as "making sure your
> app is safe," not "your app is exposed."
>
> (Under the hood — agent-only) Protection is `@vybekiit/security`, driven entirely by the `SECURITY_*`
> keys in `.env` (the single source of truth — see core `securityConfigSchema`). The web app enforces
> it in `middleware.ts` (already wired, on by default: same-origin lock + per-IP rate limit on
> `/api/*`). The same toggles drive the Cloudflare edge config in `infra/cloudflare/` at go-live. Never
> name "rate limit", "CORS", or "origin" to the builder unless they ask — say "request limits" and
> "blocking requests from other sites."

## Steps

1. **Explain in one line.** *"I'm going to make sure your app is safe from abuse — limiting how fast
   anyone can hammer it and blocking requests pretending to come from other sites. It's already on; I'll
   tune it to your app."*

2. **Confirm it's on.** Check `.env` has `SECURITY_RATE_LIMIT="on"` and `SECURITY_ORIGIN_LOCK="on"`
   (these are the defaults; if a previous step turned one off, turn it back on unless the builder asked
   otherwise). Confirm `middleware.ts` is present.
   **Verify:** both switches are `on` and the app still builds.

3. **Tune the limits to their app.** Defaults are 60 requests / 60 seconds per visitor. If they expect
   heavy legitimate traffic (lots of quick actions), raise `SECURITY_RATE_LIMIT_MAX`; if it's a
   sensitive internal tool, lower it. Pick a sensible value and tell them in one sentence what it means
   ("each visitor can do up to N actions a minute before being asked to slow down").
   **Verify:** the value is a positive number and the app builds.

4. **Allow any sites that genuinely need access.** If they have a separate landing page or another site
   that calls this app, add its address to `SECURITY_ALLOWED_ORIGINS` (comma-separated). Otherwise leave
   it blank — that means "only your app," the safest setting.
   **Verify:** confirm with them which sites (if any) should be allowed.

5. **Prove it works.** Make a quick burst of requests to a `/api/*` route past the limit and confirm the
   app starts returning "too many requests" (HTTP 429); make a request with a foreign `Origin` header to
   an API route and confirm it's blocked (HTTP 403). Then confirm a normal page load still works.
   **Verify:** abuse is blocked, normal use is not. 🎉 *Celebrate* — their app defends itself now.

6. **At go-live, extend it to the edge.** Remind them (or do it during `go-live`) that the same
   protection also runs at the hosting edge via `infra/cloudflare/` for hosted apps — so abuse is
   stopped before it even reaches the app. No new values needed; the edge reads the same settings.
   **DDoS layers (agent-only):** edge worker caps distributed abuse; app tiered limits cap per-instance
   hammering; Cloudflare WAF rules attach at go-live for the strictest cap.

7. **Tune per-route limits.** Login routes use a **stricter** limit (`SECURITY_RATE_LIMIT_AUTH_MAX`);
   contact forms and waitlists use a **lenient** limit (`SECURITY_RATE_LIMIT_PUBLIC_FORM_MAX`) so
   real visitors aren't blocked. Payment webhooks skip origin lock — they're verified by signature instead.
   **Verify:** `/api/contact` survives human-paced submits while `/api/auth/signin` blocks hammering.

8. **Database safety.** Confirm all data access uses `@vybekiit/db` (no raw SQL). Grep for `$executeRaw`
   or string-built queries and replace them. Run `vybekiit apply-preset audit_log` and confirm RLS on
   buyer tables (`platform-skills/db-presets-vybekiit.md`).
   **Verify:** `vybekiit verify-presets audit_log`; no raw SQL in the app; zod on every API body.

9. **Optional edge KV (agent-only).** `@/vybekiit/kv` may back feature flags when you extend hardening —
   never Redis or Upstash for buyers. Client-side cache is `@vybekiit/client-state` (TanStack Query).
   **Verify:** no buyer-facing Redis setup docs or env keys added.

## If anything breaks

Run `doctor`. If real visitors hit "too many requests", the limit is too low — raise
`SECURITY_RATE_LIMIT_MAX`. If a legitimate connected site is blocked, add it to
`SECURITY_ALLOWED_ORIGINS`. Never paste raw errors; translate to the one fix.

## Definition of done

`SECURITY_RATE_LIMIT` and `SECURITY_ORIGIN_LOCK` are on, tuned to the app, abuse is blocked in a quick
test, normal use works, and the builder knows (in plain words) their app is protected.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
