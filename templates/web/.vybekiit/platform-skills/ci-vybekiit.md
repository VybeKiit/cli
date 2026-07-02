# Platform wrapper: online checker / CI (agent-only)

**Agent-only.** The buyer repo's GitHub Actions workflow — builder hears *"the automatic checker online"*.

## What runs

File: `.github/workflows/ci.yml`

- **Matrix:** ubuntu-latest, macos-latest, windows-latest
- **Steps:** `pnpm install --frozen-lockfile` → `pnpm verify` (same as local pre-push)
- **Playwright:** ubuntu job only, when the template ships UI walkthrough tests
- **Cache:** `setup-node` with `cache: pnpm` — key includes lockfile hash automatically

## Agent responsibilities

1. Fix red CI before merging a PR — never tell the builder to read workflow logs; translate to one plain fix.
2. When opening PRs (`ship-via-pr-vybekiit.md`), wait for all three OS jobs green before `gh pr merge`.
3. Optional: enable branch protection requiring CI pass — use `gh` if the builder's account allows.

## Pre-push alignment

Local `.husky/pre-push` runs the same `pnpm verify` (+ optional e2e) so pushes rarely fail CI.

## Verify

All matrix jobs green on the PR before merge.
