# ADR-0009 — Secure-by-default: dual-layer security + tiered limits

- **Status:** Accepted
- **Date:** 2026-06-29
- **Deciders:** Yosef (owner), via security vertical session

## Context

Non-coders never ask for rate limits, origin lock, SQL injection defense, endpoint exposure, or
Google OAuth setup. VybeKiit must ship protection by default and expose plain `.env` toggles the
agent tunes — not code the buyer edits.

## Decision

1. **One backbone:** `@vybekiit/security` — framework-agnostic guard reading core `securityConfigSchema`.
2. **Three enforcement points:** web `middleware.ts`, Cloudflare edge (`infra/cloudflare/security-worker.ts`),
   agent skills (`harden`, `check-safety`).
3. **Tiered rate limits:** `auth-strict` (login), `public-form` (contact), `webhook` (signature not origin),
   `default` — separate env keys (`SECURITY_RATE_LIMIT_AUTH_MAX`, `SECURITY_RATE_LIMIT_PUBLIC_FORM_MAX`).
4. **Endpoint taxonomy:** documented in `check-safety` skill — public lenient/strict, authed-only, webhook, never-public admin.
5. **SQL injection:** DataProvider parameterized queries; RLS on Supabase; zod at API boundary; agent greps for raw SQL.
6. **DDoS:** edge worker + app tiered limits + provider WAF at go-live.
7. **Google OAuth (cross-platform):** web = better-auth; mobile = Expo Google OAuth → backend verifier; extension = `chrome.identity` → verifier.
8. **Doctor:** agent CLIs (`claude`, `codex`, `skills`) + cloud CLIs + platform-skills manifest verify (ADR-0001 update).

## Consequences

- Webhooks must skip origin lock; signature verification is mandatory.
- Contact forms use lenient limits — never share auth-strict bucket.
- Mobile/extension security toggles live on backend `.env`, not client bundles.

## Alternatives rejected

- **Single global rate limit:** would throttle contact forms like login.
- **Redis rate limiter by default:** violates zero-config keystone; edge + in-memory accepted for v1.
