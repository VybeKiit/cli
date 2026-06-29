# @vybekiit/security

Built-in protection — rate limits and same-origin lock, on by default.

**Part of [VybeKiit](https://vybekiit.com)** — maintained logic your scaffolded app depends on. You don't edit this code. When VybeKiit ships fixes, your agent runs the **update-kit** skill and version bumps install automatically — no merge conflicts.

## What it does

App-layer security guard driven entirely from env. Your agent enables or tunes it in the harden flow.

## In your app

Your template already imports this package. Settings live in your **secret settings file** (.env); validation lives in @vybekiit/core. Change behavior by updating env values or asking your agent to enable a feature skill — not by editing files inside node_modules.

## For your agent

- **Do not edit** node_modules/@vybekiit/security — fix bugs upstream or bump the package version.
- **Entry point:** `SecurityGuard`, `resolveSecurityPolicy`, `RateLimiter`, `isOriginAllowed`
- **Config:** `SECURITY_RATE_LIMIT`, `SECURITY_ORIGIN_LOCK` (both default `on`)
- **Related skills:** `harden`, `check-safety`
- **Pattern:** resolve*Provider() reads env via @vybekiit/core and returns a headless adapter.

## Scope

**In scope**

- Per-IP rate limiting, origin lock, route classification.
- Not a WAF — edge rules live in hosting config.

**Out of scope**

- UI components, screens, or copy — those are **owned** by your app template.
- Direct edits in node_modules — use update-kit instead.

## Updates

```bash
npm update @vybekiit/security
```

Or run the **update-kit** skill — it uses planKitUpdate() from @vybekiit/agent-kit to bump all @vybekiit/* packages safely.

## Docs

- [VybeKiit monorepo](https://github.com/VybeKiit/vybekiit)
- [Owned vs Maintained](https://github.com/VybeKiit/vybekiit/blob/main/CONTEXT.md#the-architectural-backbone-owned-vs-maintained)
- Maintainer agent rules: [AGENTS.md](https://github.com/VybeKiit/vybekiit/blob/main/AGENTS.md) (for kit contributors only)

## License

MIT
