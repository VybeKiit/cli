# ADR-0044 — Component library (ui.vybekiit.com) deploys via OpenNext → Cloudflare Workers, gated by Cloudflare Access

- **Status:** Accepted — pipeline code landed 2026-07-12. Provisioning (the Cloudflare Worker
  `vybekiit-ui`, the `ui.vybekiit.com` custom domain, and the Cloudflare Access GitHub policy) is the
  owner's remaining step; the deploy job stays gated off (`CF_DEPLOY_UI_LIBRARY` unset) until then.
- **Date:** 2026-07-12
- **Deciders:** Yosef (owner)

Extends [ADR-0028](./0028-landing-deploy-opennext-workers.md) (landing deploys via OpenNext →
Cloudflare Workers) — this applies the **same** mechanism to a second app rather than inventing a new
one. Serves the maintainer changelog/roadmap board from
[ADR-0041](./0041-auto-generated-kit-changelog-and-release-board.md).

## Context

`apps/componentLibrary` is the **maintainer** component-library browser and the `/changelog`
release/roadmap board (ADR-0041), intended to live at **`ui.vybekiit.com`**. It is a standard SSR
Next.js app (no `output: 'export'`; it ships a `next start` server).

The committed `deploy-ui-library.yml` did `wrangler pages deploy apps/componentLibrary/.next`, but
(a) it has **never run** — the job is gated on `CF_UI_PAGES_PROJECT`, which is unset, so all recent
pushes **skipped** the deploy (~1s each); and (b) uploading a server `.next/` build to Cloudflare
**Pages** does not serve a working SSR site. Meanwhile `ui.vybekiit.com` does **not** resolve
(NXDOMAIN) — the surface was never provisioned.

`apps/landing` already ships to Cloudflare the right way — **OpenNext → Workers** (ADR-0028) — and is
live (the apex returns `x-opennext: 1`). Its own `deploy-landing.yml` `pages deploy .next` job is an
equally dead stub; the real deploy runs `opennextjs-cloudflare deploy`.

The board is an **internal progress view** — it shows roadmap items and what is *missing*. That is
inappropriate for a public URL, so viewing must be restricted to authorized maintainers.

## Decision

1. **Mirror landing's OpenNext→Workers setup** in `apps/componentLibrary`: add `@opennextjs/cloudflare`
   + `wrangler` deps, `open-next.config.ts` (`defineCloudflareConfig()`), and `wrangler.jsonc` for a
   Worker named **`vybekiit-ui`** (`nodejs_compat`, `ASSETS` binding, no D1/R2/vars — the gallery needs
   no runtime bindings). Add `cf:build` / `cf:preview` / `cf:deploy` scripts. `cf:build` regenerates the
   UI catalog indexes **and** the `/changelog` board data (full git history + roadmap issues,
   ADR-0041 §4) *before* `next build`, so every deploy is current and degrades gracefully to an empty
   roadmap when `gh` is unavailable.

2. **Rewrite `deploy-ui-library.yml`** to `pnpm --filter vybekiit-component-library cf:deploy`
   (replacing `pages deploy .next`). Gate on repo var **`CF_DEPLOY_UI_LIBRARY`** (any non-empty value
   enables it) + secrets `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`. Keep `fetch-depth: 0` and
   `issues: read` so the changelog generator can read every release and the roadmap.

3. **Map `ui.vybekiit.com`** as the `vybekiit-ui` Worker's custom domain (the `vybekiit.com` zone is
   already on Cloudflare).

4. **Gate viewing with Cloudflare Access** (Zero Trust) over `ui.vybekiit.com`: GitHub as the login
   method with a policy allowing only authorized users (org / usernames / emails). Enforced at the
   edge — **no app-level auth code**. "Deployed + gated" is verified by a green deploy run **plus** an
   unauthenticated request to `/changelog` returning **`302 → Access login`** (not a bare `200`).

## Consequences

- **One deploy mechanism across apps** — landing and the component library both ship OpenNext →
  Workers; no Pages-vs-Workers split to reason about, and the dead `pages deploy .next` path is gone.
- **Worker, not Pages** — the deploy target changes; `wrangler.jsonc` owns the Worker name, so the old
  `CF_UI_PAGES_PROJECT` gate is replaced by `CF_DEPLOY_UI_LIBRARY`.
- **The board is private by construction** — roadmap / "missing" items are never exposed publicly; only
  authorized GitHub users reach it.
- **Self-refreshing board** — because regen lives inside `cf:build`, every Worker deploy rebuilds the
  changelog from live history/issues (ADR-0041 §4), with no separate step to forget.
- **Two new deps** on the app (`@opennextjs/cloudflare`, `wrangler`) — accepted; they are the same
  versions landing pins.

## Alternatives rejected

- **Static export to Cloudflare Pages** (`output: 'export'` → `out/`) — the app has dynamic routes
  (`/embed/vybekiit/[name]`, design-system `[slug]`) and `ssr: false` client galleries; each dynamic
  route would need `generateStaticParams`, the build would balloon to thousands of pre-rendered pages,
  and it diverges from how landing ships. Rejected for cost + inconsistency.
- **Keep `wrangler pages deploy .next`** — never worked (wrong artifact for an SSR build) and never
  ran. Rejected as non-functional.
- **Deploy manually like landing currently does** — no automated freshness; the whole point of the
  board (ADR-0041) is that it self-refreshes on deploy. Rejected.
- **App-level GitHub auth (NextAuth + org check)** — more code and maintenance on an otherwise static
  gallery; Cloudflare Access gates the whole surface at the edge with zero app code. Rejected.

## References

- [ADR-0028](./0028-landing-deploy-opennext-workers.md) — OpenNext → Workers (the pattern reused)
- [ADR-0041](./0041-auto-generated-kit-changelog-and-release-board.md) — the board this serves; §4 regen contract
- Template: `apps/landing/{wrangler.jsonc,open-next.config.ts}` + its `cf:*` scripts
- Evidence: `deploy-{landing,ui-library}.yml` runs all `skipped`; apex `x-opennext: 1`; `ui.vybekiit.com` NXDOMAIN
