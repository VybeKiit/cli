# Platform wrapper: GitHub Pages deploy (free static host)

**Agent-only.** Invoked by buyer skill `go-live` when `HOSTING_PROVIDER=github-pages` (ADR-0040).
The free, zero-cold-start static host tied to the buyer's own repo — best for the spa, extension
popup, and static web targets. Static only: no SSR/backend (use cloudflare or deno-deploy for those).

## Official upstream

- Docs: https://docs.github.com/en/pages
- CLI: `gh` (installed + probed by `vybekiit doctor`) — GitHub Pages needs no extra host CLI
- Auth: `gh auth login` (browser once) or `GITHUB_TOKEN`/`GH_TOKEN` in CI — never stored in `.env` (ADR-0001)

## Kit wiring

1. Call `resolveHosting()` from `@vybekiit/deploy` — returns the GitHub Pages adapter
2. `deploy({ buildDir, projectName })` publishes a public repo + enables Pages and returns the live
   URL (delegates to the shared Live-work provision path — one code path for buyer + dogfood)
3. Optional setting: `GITHUB_PAGES_OWNER` — owner/org login; defaults to the authenticated GitHub login
4. Token: from `gh auth token` / `GITHUB_TOKEN`, read at deploy time and never printed

## Verify-before-advance

- `gh auth status` succeeds
- `resolveHosting().deploy({ buildDir, projectName })` returns a live `*.github.io` URL
- Open the URL in the browser before celebrating (the first Pages build can take a moment)
