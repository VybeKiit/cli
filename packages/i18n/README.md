# @vybekiit/i18n

Multiple languages without framework glue — locales and message catalogs, headless.

**Part of [VybeKiit](https://vybekiit.com)** — maintained logic your scaffolded app depends on. You don't edit this code. When VybeKiit ships fixes, your agent runs the **update-kit** skill and version bumps install automatically — no merge conflicts.

## What it does

Locale resolution and catalog loading your template wires into Next.js or Expo i18n.

## In your app

Your template already imports this package. Settings live in your **secret settings file** (.env); validation lives in @vybekiit/core. Change behavior by updating env values or asking your agent to enable a feature skill — not by editing files inside node_modules.

## For your agent

- **Do not edit** node_modules/@vybekiit/i18n — fix bugs upstream or bump the package version.
- **Entry point:** `resolveI18nProvider`, `createLocalI18n`, `I18nProvider`
- **Config:** `I18N_PROVIDER` (default `local`), `DEFAULT_LOCALE` (default `en`)
- **Related skills:** `add-language`
- **Pattern:** resolve*Provider() reads env via @vybekiit/core and returns a headless adapter.

## Scope

**In scope**

- Locale lists, message catalog loader.
- No translated UI — your app owns copy files.

**Out of scope**

- UI components, screens, or copy — those are **owned** by your app template.
- Direct edits in node_modules — use update-kit instead.

## Updates

```bash
npm update @vybekiit/i18n
```

Or run the **update-kit** skill — it uses planKitUpdate() from @vybekiit/agent-kit to bump all @vybekiit/* packages safely.

## Docs

- [VybeKiit monorepo](https://github.com/VybeKiit/vybekiit)
- [Owned vs Maintained](https://github.com/VybeKiit/vybekiit/blob/main/CONTEXT.md#the-architectural-backbone-owned-vs-maintained)
- Maintainer agent rules: [AGENTS.md](https://github.com/VybeKiit/vybekiit/blob/main/AGENTS.md) (for kit contributors only)

## License

MIT
