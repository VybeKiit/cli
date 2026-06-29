# Platform skills — web template (agent-only)

Layer B execution knowledge. The builder never sees these files — buyer skills in
`../skills/` invoke them under the hood.

## Source-of-truth hierarchy

1. Buyer `AGENTS.md` + `language.md` + goal skills
2. `@vybekiit/*` package interfaces
3. Official platform docs (API facts win)
4. Pinned official skills in `.agents/skills/`
5. These VybeKiit wrappers (kit wiring only)

## Pinned official skills

Installed into `.agents/skills/`:

```bash
npx skills add vercel-labs/agent-skills \
  --skill vercel-react-best-practices \
  --skill vercel-composition-patterns -y
```

Cloudflare plugin skills may live globally on the maintainer machine or be pinned the same way
when the buyer selects Cloudflare hosting (default).

## Wrapper index

| Wrapper | Invoked by buyer skill | Official upstream |
|---|---|---|
| `nextjs-vybekiit.md` | generic coding / layouts | vercel-labs Next.js skills + nextjs.org/docs |
| `shadcn-vybekiit.md` | generic UI work | ui.shadcn.com + kit `src/components` |
| `deploy-cloudflare-vybekiit.md` | `go-live` (default) | developers.cloudflare.com + wrangler |
| `deploy-vercel-vybekiit.md` | `go-live` when `HOSTING_PROVIDER=vercel` | vercel.com/docs + vercel CLI |
| `assets-vybekiit.md` | `add-images`, `add-files`, `go-live` | R2 + CF Image Resizing + `@vybekiit/assets` |
| `supabase-vybekiit.md` | `save-data`, `doctor` | supabase.com/docs + supabase CLI |
| `better-auth-vybekiit.md` | `add-signin` | better-auth.com/docs + `@vybekiit/auth` |
| `lemon-squeezy-vybekiit.md` | `setup-payments` (default) | docs.lemonsqueezy.com + `@vybekiit/payments` |
| `stripe-vybekiit.md` | `setup-payments` when `PAYMENTS_PROVIDER=stripe` | docs.stripe.com + `@vybekiit/payments` |
| `paypal-vybekiit.md` | `setup-payments` when `PAYMENTS_PROVIDER=paypal` | developer.paypal.com + `@vybekiit/payments` |
| `resend-vybekiit.md` | `setup-email` when `EMAIL_PROVIDER=resend` | resend.com/docs + `@vybekiit/email` |
| `ses-vybekiit.md` | `setup-email` when `EMAIL_PROVIDER=ses` | docs.aws.amazon.com/ses + `@vybekiit/email` |
| `code-hygiene-vybekiit.md` | generic coding (invisible) | DRY/SSOT/check-before-create guardrails |
| `planning-vybekiit.md` | `plan-my-idea` | CONTEXT.md format; no ADRs for buyers |
| `observability-vybekiit.md` | generic coding + `track-errors` | `@vybekiit/core` logger + `@vybekiit/observability` |
| `sentry-vybekiit.md` | `track-errors` | docs.sentry.io + `@vybekiit/observability` |
| `ui-consistency-vybekiit.md` | generic UI work | `.vybekiit/agent/ui-sources.md` + kit primitives |
| `ui-routing-vybekiit.md` | generic UI work | VybeKiit UI catalog MCP + intent → source map |
| `testing-vybekiit.md` | generic coding (invisible) | vitest + Testing Library patterns in `src/**/__tests__/` |
| `format-lint-vybekiit.md` | generic coding (invisible) | Biome in template — `pnpm format` / `pnpm lint` |
| `react-patterns-vybekiit.md` | generic coding (invisible) | kit hooks, FormField, folder map, soft size limits |
| `responsive-vybekiit.md` | generic UI / layouts (web) | mobile-first Tailwind breakpoints |
| `github-vybekiit.md` | `back-up-my-code` | `gh` auth, private repo, push |
| `playwright-vybekiit.md` | generic UI (web) | UI walkthrough tests — `@playwright/test` |
| `ci-vybekiit.md` | push / PR flow (invisible) | `.github/workflows/ci.yml` online checker |
| `ship-via-pr-vybekiit.md` | save progress / impatient builder | worktree → PR → CI → merge |
| `i18n-vybekiit.md` | generic UI / `add-language` | next-intl + `messages/` catalog |
| `env-secrets-vybekiit.md` | all secret handling | `.cursorignore`, never echo `.env` |
