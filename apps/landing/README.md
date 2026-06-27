# apps/landing — the VybeKiit store

Our own marketing + checkout site, and a **workspace member in the CI gate** (`next build` +
`tsc` + tests run on every change). It is **dogfooded from `templates/web`** — the same stack we
sell (Next.js + shadcn-over-Tailwind, shared `@vybekiit/tokens`, RTL-safe layout) — so the landing
page is itself proof the kit works.

## What's here

- **Marketing home** (`app/page.tsx`) — data-driven sections (hero, the six pillars, the rival
  comparison matrix, pricing, FAQ). All copy/data lives in `src/data/*` as typed constants; the
  components only render. The `$29` is the single `PRICE` constant in `src/data/site.ts`.
- **Checkout** (`app/checkout` + `app/api/checkout/route.ts`) — collects the buyer's GitHub
  username + email, validates both, and creates a hosted checkout via the provider-agnostic
  `@vybekiit/payments`. What's sold comes from `STORE_PRODUCT_ID` (see root `.env.example`).
  `app/success` and `app/cancel` are the post-checkout states.
- **The gate** — the only store-specific logic over the template:
  - `src/lib/gate.ts` — invite/remove a buyer on the private repo via the GitHub API.
  - `app/api/webhook/route.ts` — payment webhook → the gate (paid → invite, refund → remove).

This is the v1.0 keystone: *a stranger pays → gets invited → scaffolds a web app → wires payments
→ deploys live* (see `CONTEXT.md` → Build order).

## Still to wire (issue #4 — live)

Real checkout + the gate need the store's live Lemon Squeezy keys and `STORE_PRODUCT_ID`, and per
ADR-0005 the webhook should invite to the per-template **mirrors** (`web` + `mobile` + `extension`),
not the single repo modeled here. Tracked under issue #4. Deploy target: Cloudflare Pages.
