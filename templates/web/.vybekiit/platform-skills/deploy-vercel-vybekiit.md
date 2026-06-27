# Platform wrapper: Vercel deploy (opt-in host)

**Agent-only.** Invoked by buyer skill `go-live` when `HOSTING_PROVIDER=vercel`.

## Official upstream

- Docs: https://vercel.com/docs
- CLI: `vercel` (installed + probed by `vybekiit doctor` when Vercel hosting is selected)
- Pinned Next.js skills in `.agents/skills/` cover App Router patterns (not deploy CLI details)

## Kit wiring

1. Set `HOSTING_PROVIDER=vercel` in `.env` (agent decides — builder never picks hosts)
2. Call `resolveHosting()` from `@vybekiit/deploy` — returns Vercel adapter
3. Supply a `VercelRunner` that executes the adapter's vercel action (go-live skill owns the shell)
4. Secret settings: `VERCEL_TOKEN` in `.env`; optional `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` after link
5. CLI auth: token-based (`VERCEL_TOKEN`) or `vercel login` for interactive link — see ADR-0006

## Verify-before-advance

- `vercel whoami` succeeds (or token validates)
- Deploy returns production URL
- Open URL before celebrating
