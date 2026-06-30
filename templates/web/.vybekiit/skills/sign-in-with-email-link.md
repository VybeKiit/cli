# Skill: sign-in-with-email-link

**Goal:** people can sign in with a one-click email link (no password).

**Contract:** one action at a time · verify-before-advance · plain language · translate errors · celebrate.

> (Agent-only) Routes: `POST /api/auth/magic-link`, `POST /api/auth/magic-link/verify`.

## Steps

1. **Confirm sign-in + email are wired** (`add-signin`, `setup-email` when going live).
   **Verify:** email OTP or password sign-in already works.

2. **Add "Email me a link"** on the login screen → `POST /api/auth/magic-link` with `{ email }`.
   **Verify:** practice mode succeeds.

3. **Handle the return link** → `POST /api/auth/magic-link/verify` with `{ token }`. Local dev token:
   `local-magic-token`.
   **Verify:** lands on dashboard signed in.

4. **Append checklist entry** (magic link sign-in enabled).

## If anything breaks

Run `vybekiit doc-fallback better-auth` on first MCP/debug failure; use the plain stuck phrase from
`formatBuilderStuckMessage()` — never say MCP to the builder.

## Definition of done

Request link → verify → dashboard; checklist updated.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*

