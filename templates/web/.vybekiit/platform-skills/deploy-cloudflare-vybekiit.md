# Platform wrapper: Cloudflare deploy (default host)

**Agent-only.** Invoked by buyer skill `go-live` when `HOSTING_PROVIDER=cloudflare` (default).

## Official upstream

- Docs: https://developers.cloudflare.com
- CLI: `wrangler` (installed + probed by `vybekiit doctor`)
- Pinned skills: `.agents/skills/wrangler/SKILL.md`, `.agents/skills/workers-best-practices/SKILL.md`

## Kit wiring

1. Call `resolveHosting()` from `@vybekiit/deploy` — returns Cloudflare adapter
2. Supply a `CloudflareRunner` that executes the adapter's wrangler action (go-live skill owns the shell)
3. Secret settings: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` in `.env`
4. CLI auth: `wrangler login` (browser once) — probed by `doctor`, not stored in `.env`

## Verify-before-advance

- `wrangler whoami` succeeds
- `resolveHosting().deploy({ buildDir, projectName })` returns a live URL
- Open the URL in browser before celebrating
