<p align="center">
  <img src="https://raw.githubusercontent.com/VybeKiit/vybekiit/main/assets/hero.webp" width="1000" height="1000" alt="VybeKiit">
</p>

# VybeKiit

[![CI](https://github.com/VybeKiit/vybekiit/actions/workflows/ci.yml/badge.svg)](https://github.com/VybeKiit/vybekiit/actions/workflows/ci.yml)

> **Status: blueprint + v1.0 scaffold.** This is the maintainer monorepo for VybeKiit — the paid,
> agent-driven starter kit. If you're a buyer, you never read this; your agent does.

A paid, GitHub-distributed monorepo starter kit that lets a non-technical builder ship a real,
money-making product by *describing* it to an AI agent — without having to *understand* the
plumbing. The product isn't the boilerplate (that's commodity); it's the **agent layer** that
carries a vibe coder from "I bought this" to "my app is live and taking payments."

Read **[CONTEXT.md](./CONTEXT.md)** for the full blueprint and **[AGENTS.md](./AGENTS.md)** for
how agents work in this repo.

## Layout

```
packages/   MAINTAINED · published to npm as @vybekiit/* · headless logic (no UI)
  core/             env + Zod-validated config (the single source of truth) + Result type
  payments/         one PaymentProvider interface · Lemon Squeezy + Stripe + PayPal adapters
  auth/             headless Supabase auth
  db/               typed Supabase data client
  browser-automation/  Unified dashboard Playwright CLI (CWS + Lemon Squeezy)
templates/  OWNED · NOT published · copied into a buyer's repo by the CLI
  web/              Next.js + shadcn (RTL-ready) + the buyer-facing agent layer
  spa/              Vite admin SPA + agent layer
  mobile/           Expo + shared tokens — full web parity
  extension/        WXT browser extension scaffold + agent layer
  backend/          Express MVC API for mobile/extension/spa clients
apps/landing/       marketing site — dogfoods templates/web · Cloudflare Pages
cli/                `npx vybekiit` — scaffolds a template into the buyer's own repo
```

The maintained packages and the owned templates are governed by the **Owned vs Maintained** split
(see `CONTEXT.md`) — the backbone that makes "lifetime updates for people who can't read a diff"
actually work: updates ship as npm version bumps, never git merges.

## Develop

```bash
pnpm install            # install the workspace (runs preflight checks automatically)
pnpm build              # build all packages (turbo)
pnpm test               # run tests
pnpm typecheck          # strict tsc across the workspace
pnpm lint               # biome check
```

### Prerequisites

| Tool | Version | Required | Why |
|------|---------|----------|-----|
| Node.js | ≥ 20 | ✅ | runtime + build |
| pnpm | ≥ 10 | ✅ | workspace package manager (pinned via `corepack`) |
| git | ≥ 2.30 | ✅ | hooks + monorepo |
| Rust | edition 2021+ | ✅ | builds `tools/dedup` (the dedup gate binary) |
| corepack | any | optional | enables pnpm from `packageManager` field |
| GitHub CLI (`gh`) | any | optional | mirror sync + PR creation |
| Docker | any | optional | `pnpm verify:docker` native-deps check |

Run `pnpm preflight` to check all prerequisites with install instructions for your OS.

See `.nvmrc` / `package.json` engines.

## Build order

v1.0 cuts a thin vertical slice — **web + the money pipeline first** (Lemon Squeezy checkout →
GitHub invite). See `CONTEXT.md` → *Build order*.

## Licensing

Dual-licensed by component — public packages MIT, the owned product proprietary. See
[LICENSE.md](./LICENSE.md).
