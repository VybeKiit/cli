# Security Guardrails

Non-negotiable rules that every agent (Claude, Cursor, Copilot, Windsurf, etc.)
and every vibe coder MUST follow. These are enforced by CI and pre-push hooks.

---

## 1. Scripts go in `dev-scripts/` — never committed

Any ad-hoc script the agent writes (seed, migrate, debug, one-off) goes in
`dev-scripts/`. This folder is gitignored. It NEVER reaches the remote.

If the script is meant to ship (e.g. CI helpers, build steps), it goes in
`scripts/` — but MUST be reviewed before merge.

## 2. Never push directly to main

All changes go through a feature branch → pull request → CI passes → merge.
The CI Gate job must be green before any merge to `main`.

```
git checkout -b feat/my-feature
# ... work ...
git push -u origin feat/my-feature
# Open PR → CI runs → review → merge
```

## 3. Never expose secrets

- Never `echo`, `cat`, `console.log`, or `grep` an actual secret value.
- Never commit `.env` files — only `.env.example` with `YOUR_*_HERE` placeholders.
- Reference secrets by key name, never by value.
- If a command output might contain a secret, pipe through `sed 's/=.*/=<redacted>/'`.

## 4. CI Gate blocks deployment

Every push triggers the full CI pipeline:

1. **biome** — lint + format (deterministic, no auto-fix in CI)
2. **typecheck** — `tsc --noEmit`
3. **test** — `vitest run`
4. **build** — production build must succeed

ALL four must pass. If any fails, merge is blocked.

## 5. Secure coding defaults

| Pattern | Rule |
|---------|------|
| SQL | Always use parameterized queries or an ORM. Never interpolate user input into SQL strings. |
| Validation | Validate ALL user input with Zod before processing. |
| Auth | Never skip auth middleware on protected routes. |
| CORS | Explicitly allowlist origins. Never use `*` in production. |
| Rate limiting | All public API endpoints must be rate-limited. |
| Error messages | Never expose stack traces or internal details to the client. |
| Dependencies | Pin versions. Audit before adding unfamiliar packages. |

## 6. Pre-push hook

The `.husky/pre-push` hook runs the full verification pipeline locally before
any code reaches the remote. If it fails, the push is rejected.

```
pnpm verify
```

This runs: format → lint → typecheck → test → agent pattern checks.

## 7. Environment variables

- `.env.example` — committed, documents all required vars with placeholder values
- `.env` / `.env.local` — gitignored, contains real values locally
- Production secrets are set via the hosting provider's env config (never in code)

---

_These rules are enforced by the CI pipeline, pre-push hooks, and the safety
scanner (`scripts/safety-scan.mjs`). Violations will block deployment._
