# ADR-0001 — Agentic CLI toolchain: global install, interactive login, programmatic provisioning

- **Status:** Accepted
- **Date:** 2026-06-27
- **Deciders:** Yosef (owner), via `/grill-with-docs`

## Context

For the agent to be "real agentic" — to create databases and deploy without the vibe coder touching
config — the CLIs it drives (`supabase`, `wrangler`) must be installed *and* authenticated *and*
have something to act on (a Supabase project). Each of those three has a hands-off-vs-robust fork,
and one of them collides with a locked decision (single `.env` source of truth).

The buyer is a semi-technical "vibe coder": they can follow one simple step at a time but will not
hunt for an API token in a provider's settings UI, and a dead-end with no agent to translate it
ends in a refund.

## Decision

1. **Install: globally, OS-aware, via a maintained `vybekiit doctor` subcommand** — not project
   devDependencies, not a `postinstall`. Supabase discourages its npm-global package (native install
   preferred) and `gh`-class tools aren't npm at all, so a per-OS installer is the honest mechanism.
   Centralizing it in the CLI keeps one updatable home; fixes ship via an npm bump.
2. **Auth: interactive browser login** (`wrangler login`, `supabase login`), *not* env tokens.
   For a non-coder, "click Authorize in the window that just opened" beats "find and copy a correctly
   scoped API token." The agent triggers the login, hands off the single click, and waits.
3. **Provisioning: fully programmatic** — after login the agent runs `supabase projects create`,
   generates the DB password, picks a region from one plain question, polls to healthy, writes the
   runtime keys into `.env`, and pushes the schema. Zero dashboard visits.

## Consequences

- **Amends the single-`.env` rule.** `.env` remains the source of truth for *runtime* secrets
  (`SUPABASE_URL`/`ANON`/`SERVICE_ROLE`, payment keys), but *CLI/deploy auth* now lives in each
  tool's native store (`~/.wrangler`, Supabase keychain). `vybekiit doctor` must verify auth by
  **probing** (`wrangler whoami`, a Supabase API call), never by reading `.env`.
- **Less scriptable than env-token auth.** Interactive login can't be fully automated; every auth is
  an agent hand-off + wait. Accepted for the UX win.
- **Provisioning is brittle.** `projects create` can stall, and free-tier/org/billing walls exist.
  `doctor` owns these failure modes and translates them; without a strong `doctor` this path strands
  a non-coder. This raises the bar on the `doctor` skill + subcommand.
- **`doctor` does double duty** — it both *provisions* (installs missing CLIs, can create the DB) and
  *diagnoses*. The human-facing `doctor` skill is a thin wrapper over the `vybekiit doctor` CLI.

## Alternatives rejected

- **Env-token auth + project devDependencies** (the original single-`.env`, scriptable model):
  cleaner for automation and keeps one source of truth, but makes the buyer hunt for scoped tokens —
  the exact friction this product exists to remove.
- **Guide-create the Supabase project** (buyer makes it in the dashboard, agent links): more robust
  against org/billing walls, but less hands-off than the owner wanted.
