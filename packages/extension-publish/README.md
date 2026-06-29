# @vybekiit/extension-publish

Publish your Chrome extension to the Web Store — your agent handles the dashboard clicks.

**Part of [VybeKiit](https://vybekiit.com)** — maintained logic your scaffolded app depends on. You don't edit this code. When VybeKiit ships fixes, your agent runs the **update-kit** skill and version bumps install automatically — no merge conflicts.

## What it does

Playwright automation for Chrome Web Store Developer Console actions the upload API does not cover: listing updates, screenshots, review status, new store items.

## In your app

Your template's `.vybekiit/skills/` folder holds most agent instructions. This package holds the **shared** pieces that must stay identical across web, mobile, and extension — the contract, vocabulary, and update planner.

## For your agent

- **Do not edit** `node_modules/@vybekiit/extension-publish` — fix bugs upstream or bump the package version.
- **Verb allowlist:** `CWS_AUTOMATION_VERBS` in `src/verbRegistry.ts` — only registered verbs may run.
- **Chrome profile:** dedicated profile at `$HOME/.cws-chrome-profile` — never attach to the operator's default browser.
- **Before push verbs:** `verifyGate` runs `pnpm verify:release` — do not bypass.
- **Flow:** `pnpm cws <verb> <extension>` → verb registry → `connectToCwsChrome()` → selectors + `safeClick()`.
- **Listing updates:** `extensions/<id>/cws-listing.ts` → validate → read live CWS → diff → update → verify gate.
- **Related skills:** extension publish skills, `refresh-cws-listing`
- **Safety:** read ADR-0011/0012 before changing behavior; no destructive verbs without ADR amendment; no bypassing `safeClick`.

## Scope

**In scope**

- CWS verb allowlist, safe click guards, listing schema.
- Not local extension builds — use template build scripts.

**Out of scope**

- UI components, screens, or copy — those are **owned** by your app template.
- Direct edits in node_modules — use update-kit instead.

## Updates

```bash
npm update @vybekiit/extension-publish
```

Or run the **update-kit** skill — it uses planKitUpdate() from @vybekiit/agent-kit to bump all @vybekiit/* packages safely.

## Docs

- [VybeKiit monorepo](https://github.com/VybeKiit/vybekiit)
- [Owned vs Maintained](https://github.com/VybeKiit/vybekiit/blob/main/CONTEXT.md#the-architectural-backbone-owned-vs-maintained)
- Maintainer agent rules: [AGENTS.md](https://github.com/VybeKiit/vybekiit/blob/main/AGENTS.md) (for kit contributors only)

## License

MIT
