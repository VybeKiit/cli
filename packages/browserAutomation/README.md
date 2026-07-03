<p align="center">
  <img src="https://raw.githubusercontent.com/VybeKiit/vybekiit/main/assets/hero.webp" width="1000" height="1000" alt="VybeKiit">
</p>

# @vybekiit/browser-automation

Dashboard automation CLI for Lemon Squeezy and Chrome Web Store.

**Part of [VybeKiit](https://vybekiit.com)** — maintained logic your scaffolded app depends on. You don't edit this code. When VybeKiit ships fixes, your agent runs the **update-kit** skill and version bumps install automatically — no merge conflicts.

## What it does

Unified Playwright package with registry CLI `vybekiit-automate`. Domains: extension (CWS), payments/ls, registrars (nc/gd), google (OAuth consent + Web client). Store SSOT: `.vybekiit/store/`. Agent `--json` mode or interactive wizard.

## In your app

Your template already imports this package. Settings live in your **secret settings file** (.env); validation lives in @vybekiit/core. Change behavior by updating env values or asking your agent to enable a feature skill — not by editing files inside node_modules.

## For your agent

- **Do not edit** node_modules/@vybekiit/browser-automation — fix bugs upstream or bump the package version.
- **Entry point:** CWS verbs, `runLsSetup`, `standbyLogin`, `vybekiit-automate` CLI
- **Config:** Chrome profiles: `$HOME/.ls-chrome-profile`, `$HOME/.cws-chrome-profile`
- **Related skills:** setup-payments, publish-extension
- **Pattern:** resolve*Provider() reads env via @vybekiit/core and returns a headless adapter.

## Scope

**In scope**

- Blind DOM automation, verb registries, dual-mode CLI.
- Runtime checkout — `@vybekiit/payments`.

**Out of scope**

- UI components, screens, or copy — those are **owned** by your app template.
- Direct edits in node_modules — use update-kit instead.

## Updates

```bash
npm update @vybekiit/browser-automation
```

Or run the **update-kit** skill — it uses planKitUpdate() from @vybekiit/agent-kit to bump all @vybekiit/* packages safely.

## Docs

- [VybeKiit monorepo](https://github.com/VybeKiit/vybekiit)
- [Owned vs Maintained](https://github.com/VybeKiit/vybekiit/blob/main/CONTEXT.md#the-architectural-backbone-owned-vs-maintained)
- Maintainer agent rules: [AGENTS.md](https://github.com/VybeKiit/vybekiit/blob/main/AGENTS.md) (for kit contributors only)

## License

MIT
