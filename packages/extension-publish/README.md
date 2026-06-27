# @vybekiit/extension-publish

Chrome Web Store Developer Console automation for actions that the official upload API does not cover.

## Purpose

This package owns Playwright/CDP automation for the CWS web UI:

- importing the live listing into `extensions/<id>/cws-listing.ts`
- updating listing copy, privacy fields, regions, screenshots, and package uploads
- reading review status, version history, and violation panels
- creating a new CWS item when a new extension needs a store ID

The public callable surface is the verb allowlist exported from `src/index.ts` and `src/verbRegistry.ts`.

Automation runs against a dedicated Chrome profile at `$HOME/.cws-chrome-profile`.
Run `pnpm cws launch-chrome` before CWS verbs; first launch requires signing
that profile into the Google account that owns the Developer Console.

## Why We Need It

The repo already has build, zip, and release gates, but CWS still has UI-only workflows. This package keeps those UI workflows in one place instead of spreading fragile selectors across scripts or agents.

Keep it because:

- CWS listing edits need drift checks against live store state.
- CWS selectors need a dated, reviewable source of truth.
- Push verbs must run `pnpm verify:release` before touching CWS.
- Destructive clicks must remain blocked by `safeClick`.

Do not use it for routine local extension builds, generic Playwright tests, or non-CWS browser automation.

## Flow

```txt
pnpm cws <verb> <extension>
  -> scripts/cws/index.ts
  -> @vybekiit/extension-publish verb allowlist
  -> connectToCwsChrome()
  -> CWS page selectors + safeClick()
  -> read state or apply the requested CWS change
```

For listing updates:

```txt
extensions/<id>/cws-listing.ts
  -> CwsListingSchema validation
  -> live CWS listing read
  -> diffListing()
  -> updateListing()
  -> verify gate before push
```

## Where It Is Used

- `scripts/cws/index.ts` exposes `pnpm cws`.
- `scripts/cws/e2e-dry-run.ts` probes the automation surface.
- `scripts/cws/validate-listings.ts` validates listing source files.
- `.claude/skills/refresh-cws-listing/SKILL.md` uses the schema types.
- Extension listing files import `CwsListing` and region helpers from this package.

## Important Files

- `src/index.ts` - exported automation surface.
- `src/verbRegistry.ts` - read/push verb allowlist and destructive-name guard pattern.
- `src/connect.ts` - attaches to the dedicated CWS Chrome profile over CDP.
- `src/selectors.ts` and `src/selectors.generated.ts` - selector source of truth.
- `src/schema.ts` - `cws-listing.ts` contract.
- `src/verbs/*` - one file per CWS operation.
- `src/verifyGate.ts` - release gate enforcement for push verbs.

## Safety Rules

- Read ADR-0011 and ADR-0012 before changing behavior.
- Do not add destructive verbs unless ADR-0012 is amended first.
- Do not bypass `safeClick`.
- Do not attach to the operator's default Chrome profile.
- Do not launch Chrome outside `scripts/cws/index.ts:ensureChromeWithCdp`.
- Do not skip drift detection for listing updates.

## Verification

```bash
pnpm --filter @vybekiit/extension-publish typecheck
pnpm --filter @vybekiit/extension-publish test
pnpm --filter @vybekiit/extension-publish lint
```
