# @vybekiit/auth

Let people sign in — your agent wires accounts without you touching auth code.

**Part of [VybeKiit](https://vybekiit.com)** — maintained logic your scaffolded app depends on. You don't edit this code. When VybeKiit ships fixes, your agent runs the **update-kit** skill and version bumps install automatically — no merge conflicts.

## What it does

One auth interface with Better Auth bound to your database by default. Cognito adapter when you deploy on AWS.

## In your app

Your template already imports this package. Settings live in your **secret settings file** (.env); validation lives in @vybekiit/core. Change behavior by updating env values or asking your agent to enable a feature skill — not by editing files inside node_modules.

## For your agent

- **Do not edit** node_modules/@vybekiit/auth — fix bugs upstream or bump the package version.
- **Entry point:** `resolveAuthProvider`, `createBetterAuthProvider`, `createCognitoAuthProvider`
- **Config:** `AUTH_PROVIDER` (default `better-auth`)
- **Related skills:** `add-signin`, `save-data`
- **Pattern:** resolve*Provider() reads env via @vybekiit/core and returns a headless adapter.

## Scope

**In scope**

- Sign-up, sign-in, sessions, normalized user type.
- No login screens — template UI calls the provider.

**Out of scope**

- UI components, screens, or copy — those are **owned** by your app template.
- Direct edits in node_modules — use update-kit instead.

## Updates

```bash
npm update @vybekiit/auth
```

Or run the **update-kit** skill — it uses planKitUpdate() from @vybekiit/agent-kit to bump all @vybekiit/* packages safely.

## Docs

- [VybeKiit monorepo](https://github.com/VybeKiit/vybekiit)
- [Owned vs Maintained](https://github.com/VybeKiit/vybekiit/blob/main/CONTEXT.md#the-architectural-backbone-owned-vs-maintained)
- Maintainer agent rules: [AGENTS.md](https://github.com/VybeKiit/vybekiit/blob/main/AGENTS.md) (for kit contributors only)

## License

MIT
