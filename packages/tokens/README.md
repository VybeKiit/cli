# @vybekiit/tokens

One palette for web and mobile — change a color once, both stay in sync.

**Part of [VybeKiit](https://vybekiit.com)** — maintained logic your scaffolded app depends on. You don't edit this code. When VybeKiit ships fixes, your agent runs the **update-kit** skill and version bumps install automatically — no merge conflicts.

## What it does

Shared design tokens (colors, spacing, radius, type). Web consumes CSS variables; mobile consumes StyleSheet values.

## In your app

Your template already imports this package. Settings live in your **secret settings file** (.env); validation lives in @vybekiit/core. Change behavior by updating env values or asking your agent to enable a feature skill — not by editing files inside node_modules.

## For your agent

- **Do not edit** node_modules/@vybekiit/tokens — fix bugs upstream or bump the package version.
- **Entry point:** `colors`, `spacing`, `radius`, `fontSizes`, `cssVariables`, `hsl`
- **Config:** None — import tokens directly.
- **Related skills:** `add-screen`, styling skills in each template
- **Pattern:** resolve*Provider() reads env via @vybekiit/core and returns a headless adapter.

## Scope

**In scope**

- Design token source of truth across platforms.
- No components — templates own UI primitives.

**Out of scope**

- UI components, screens, or copy — those are **owned** by your app template.
- Direct edits in node_modules — use update-kit instead.

## Updates

```bash
npm update @vybekiit/tokens
```

Or run the **update-kit** skill — it uses planKitUpdate() from @vybekiit/agent-kit to bump all @vybekiit/* packages safely.

## Docs

- [VybeKiit monorepo](https://github.com/VybeKiit/vybekiit)
- [Owned vs Maintained](https://github.com/VybeKiit/vybekiit/blob/main/CONTEXT.md#the-architectural-backbone-owned-vs-maintained)
- Maintainer agent rules: [AGENTS.md](https://github.com/VybeKiit/vybekiit/blob/main/AGENTS.md) (for kit contributors only)

## License

MIT
