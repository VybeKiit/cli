# PROJECT.md — VybeKiit

Purpose and direction for the VybeKiit maintainer monorepo. For the domain map and decisions read
[CONTEXT.md](./CONTEXT.md); for how code is written read [CODE-STYLE.md](./CODE-STYLE.md); for the
names we use read [LANGUAGE.md](./LANGUAGE.md).

## What it is

A paid, GitHub-distributed monorepo starter kit that lets a non-technical builder (the **vibe
coder**) ship a real, money-making product — web, then mobile, then browser extension — by
*describing* what they want to an AI agent, without ever having to *understand* the plumbing.

The product is **not** the boilerplate; every boilerplate is commodity. The product is the **agent
layer**: the skills, docs, and contracts that carry a vibe coder from "I bought this" to "my app is
live and taking payments" — making every technical decision for them and translating the few
unavoidable manual steps into plain language.

## Who it's for

The **semi-technical vibe coder**: has a Claude or Codex subscription, can clearly describe what
they want, but does not want to learn environment variables, deploys, or merge conflicts. Not a
zero-code novice (they aren't shopping for a "monorepo"); not a senior dev (they'd build their own).
Secondary audience: the maintainer's own brand / lead-gen.

## The problem

"Maintained updates" and "an audience that can't read a diff" pull against each other. A non-coder
cannot resolve a merge conflict, so a kit that updates by `git merge` is unusable to them; a kit
that never updates rots. Every existing boilerplate assumes a developer on the other end — this one
assumes the agent is the developer.

## The approach

- **Owned vs Maintained** — the architectural backbone (see CONTEXT.md). MAINTAINED headless logic
  lives in private workspace packages and ships through the gated monorepo mirror / bundled CLI, not
  public npm packages; OWNED code (app shell, all UI, the buyer agent layer) is copied into the
  buyer's repo and never auto-clobbered.
- **One interface per concern, swappable adapters, one default** — the proven `@vybekiit/payments`
  shape applied to every concern. The vibe coder never picks an adapter; the agent routes via one
  `.env` setting.
- **Decide + Guide** — the agent makes every technical decision and speaks only plain language.
- **The gate** — Lemon Squeezy checkout collects a GitHub username → webhook → private-mirror
  invite. That single gate is the paywall; a refund removes access.

## Current status (2026-07-02)

- **Built, green, pushed:** `core`, `payments`, `auth`, `db`, `clientState`, the `vybekiit` CLI,
  and a real Next.js `templates/web` — all in the CI gate.
- **Two large refactors in flight, deliberately sequenced:**
  1. **Publish-surface collapse (ADR-0033, supersedes ADR-0025's five-package spine):** **0**
     packages publish to npm. The `vybekiit` CLI is the only public npm artifact and bundles the
     maintained packages it needs; buyers receive maintained logic through the gated monorepo mirror.
     There is **no public package tier** and **no `shared/` tier**.
  2. **Effect adoption (ADR-0023):** `Result`/zod/factory-wiring → Effect + `Schema` + `Layer`,
     end-to-end, one gate-green slice at a time. **In progress, not complete** — the spine packages
     are partly converted; templates, tooling, `cli`, and the buyer agent layer are not. Convert
     touched slices one gate-green pass at a time.
- The **money pipeline** (Lemon-Squeezy → GitHub invite) is still the load-bearing unproven slice —
  de-risk it before polishing templates.

## Direction

- **v1.0** — web only + the money pipeline; private packages `core`/`payments`/`auth`/`db`; the dogfooded
  landing page. Goal: a stranger pays → gets invited → scaffolds a web app → wires payments →
  deploys live in session #1 (the keystone).
- **SaaS baseline pack** — every first-party app template should feel plug-and-play for an average
  SaaS: auth, signed-in shell, dashboard, settings, pricing/billing, and a first-run product
  flow. App onboarding happens after sign-up and before the dashboard; the dashboard walkthrough
  teaches the product after the dashboard is reachable. App onboarding is mandatory but skippable:
  new users land there after sign-up, answer a few lightweight setup prompts, and can skip directly
  to the dashboard. Web and extension reuse maintained web primitives; mobile renders the same
  surface recipes with native primitives. The existing page recipe pipeline is the source of truth:
  extend `scripts/data/page-recipe-manifest.json` and
  `scripts/dev/sync/buildPageRecipeIndex.mjs --check` so the component library verifies every
  baseline web, extension, and mobile piece before template files are generated.
- **v1.1** — `update-kit`, `add-signin`, `save-data`, `buy-domain`, `setup-email`.
- **mobile** (Expo, at full web parity) — pulled forward into v1.0.
- **v3** — extension (WXT).

## Principles

KISS · YAGNI · ruthless DRY · SSOT. Reuse and extend before creating; promote to maintained
workspace code only when the buyer should not edit it. **A new module is not a new published
package.** Junior-readable, boring, traceable code. Buyer-facing prose stays jargon-free
(Decide + Guide) with **no em dashes**.
