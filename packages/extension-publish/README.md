<p align="center">
  <img src="https://raw.githubusercontent.com/VybeKiit/vybekiit/main/assets/hero.webp" width="1000" height="1000" alt="VybeKiit">
</p>

# @vybekiit/extension-publish

Publish your Chrome extension to the Web Store — your agent handles the dashboard clicks.

**Part of [VybeKiit](https://vybekiit.com)** — maintained logic your scaffolded app depends on. You don't edit this code. When VybeKiit ships fixes, your agent runs the **update-kit** skill and version bumps install automatically — no merge conflicts.

## What it does

Playwright automation for Chrome Web Store Developer Console actions the upload API does not cover: listing updates, screenshots, review status, new store items.

## In your app

Your template already imports this package. Settings live in your **secret settings file** (.env); validation lives in @vybekiit/core. Change behavior by updating env values or asking your agent to enable a feature skill — not by editing files inside node_modules.

## For your agent

- **Do not edit** node_modules/@vybekiit/extension-publish — fix bugs upstream or bump the package version.
- **Entry point:** `publish`, `submitForReview`, `readListingState`, `CWS_AUTOMATION_VERBS`, `connectToCwsChrome`
- **Config:** Dedicated Chrome profile at `$HOME/.cws-chrome-profile` — not env-based.
- **Related skills:** Extension template publish skills, `refresh-cws-listing`
- **Pattern:** resolve*Provider() reads env via @vybekiit/core and returns a headless adapter.

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
