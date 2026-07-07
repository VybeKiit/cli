<p align="center">
  <img src="https://raw.githubusercontent.com/VybeKiit/vybekiit/main/assets/brand/vybekiit-profile.svg" width="160" height="160" alt="VybeKiit logo">
</p>

# VybeKiit

[![CI](https://github.com/VybeKiit/vybekiit/actions/workflows/ci.yml/badge.svg)](https://github.com/VybeKiit/vybekiit/actions/workflows/ci.yml)

VybeKiit is a paid starter kit for vibe coders: people who know what they want to build, use an
AI coding agent, and do not want to understand the code before they can ship.

You describe the product. Your agent follows the kit instructions, sets up the app, fixes what is
broken, and walks you through the few steps only you can do.

> **Status:** active v1.0 kit work. The web app scaffold, agent instructions, and maintainer code
> are in place; the live customer purchase and access flow is still being finished.

## Start Here

After you have VybeKiit access, create your app:

```bash
npx vybekiit new web my-app
```

Then open `my-app` in [Claude Code](https://code.claude.com/docs/en/overview),
[Codex](https://developers.openai.com/codex/quickstart), or [Cursor](https://cursor.com/docs) and say:

> **Set up my app.**

Your agent reads the instructions that shipped with your app and takes it from there, one step at a
time.

## What You Can Ask For

You do not need to learn how the code works first. Start with plain requests:

- **"Set up my app."** First-time setup.
- **"Add payments."** Start taking money.
- **"Add sign-in and save data."** Add accounts and saved information.
- **"Something is broken."** Run a checkup and fix the problem.
- **"Put my app online."** Publish the latest version.

VybeKiit is built so the agent can decide the technical steps and explain only what you need to do.

## What The Kit Handles

- A real web app starting point.
- Instructions for AI coding agents.
- Checkout, sign-in, saved data, and launch paths.
- A local checkup flow so the agent can verify the app before moving on.
- Shared code the kit can keep improving over time.

You should expect to describe your product, review the result, and approve account or browser steps
when needed. You should not have to understand the code before your app can move forward.

## Requirements

You need [Node.js](https://nodejs.org/en) 20 or newer. The command uses
[`npx`](https://docs.npmjs.com/cli/v11/commands/npx) to run the VybeKiit CLI.

To get your purchased app files, VybeKiit uses the [GitHub CLI](https://cli.github.com/). If it is
not ready yet, the kit tells you what to install or sign in to.

## For Agents And Maintainers

This repository also contains the instructions and code used to build the kit itself. If you are an
agent or maintainer working inside this repo, read these first:

- [AGENTS.md](./AGENTS.md): agent rules, validation commands, and where work belongs.
- [CONTEXT.md](./CONTEXT.md): product blueprint and decisions.
- [CODE-STYLE.md](./CODE-STYLE.md): code style and current migration rules.
- [LANGUAGE.md](./LANGUAGE.md): terms, customer language, and words to avoid.

Useful maintainer commands:

```bash
pnpm install
pnpm build
pnpm test
pnpm typecheck
pnpm lint
```

Maintainer tooling uses [pnpm](https://pnpm.io/) and [Turborepo](https://turborepo.com/docs).

## License

Dual-licensed by component: public pieces are MIT, and the owned VybeKiit product is proprietary.
See [LICENSE.md](./LICENSE.md).
