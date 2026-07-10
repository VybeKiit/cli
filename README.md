<p align="center">
  <img src="https://raw.githubusercontent.com/VybeKiit/vybekiit/main/assets/brand/vybekiit-profile.svg" width="160" height="160" alt="VybeKiit logo">
</p>

<p align="center">
  <strong>For vibe coders.</strong> You do not need to be technical or understand the code to use this starter kit. Open it in an AI coding tool, paste the ready prompt below, and build one step at a time.
</p>

<p align="center">
  <strong>English</strong> ·
  <a href="README.he.md">עברית</a> ·
  <a href="README.ar.md">العربية</a> ·
  <a href="README.ru.md">Русский</a>
</p>

# VybeKiit

[![CI](https://github.com/VybeKiit/vybekiit/actions/workflows/ci.yml/badge.svg)](https://github.com/VybeKiit/vybekiit/actions/workflows/ci.yml)

VybeKiit is a paid starter kit for vibe coders: people who know what they want to build, use an AI coding helper, and do not want to learn the code before they can ship.

You describe the product. Your helper follows the kit instructions, sets up the app, fixes what is broken, and walks you through the few steps only you can do.

> **Status:** active kit work. The web app starting point, helper instructions, and kit code are in place. The live purchase and access flow is still being finished.

## Ready prompt for your AI coding tool

Open this project in [Claude Code](https://code.claude.com/docs/en/overview), [Codex](https://developers.openai.com/codex/quickstart), [Cursor](https://cursor.com/docs), Grok, Kimi, Roo, [Zed](https://zed.dev/), Kiro, [GitHub Copilot](https://github.com/features/copilot), or any other AI coding tool, then paste:

```text
I am a non-technical vibe coder using VybeKiit.

Read AGENTS.md and language.md first.
Talk to me in plain language. One step at a time. Never give me a wall of commands.
Do not expect me to understand the code.

Help me work with this starter kit project:
1. Explain what this folder is for in one short paragraph.
2. Tell me the single next thing I should do.
3. If setup is needed, do it yourself when you can, and guide me only through clicks only I can do.

Start now: set me up so I can build with an AI helper without learning the code.
```

## Start here

After you have VybeKiit access, create your app's starting point (your helper can run this for you):

```bash
npx vybekiit new web my-app
```

Then open the new folder in your AI coding tool and paste the prompt above, or simply say:

> **Set up my app.**

Your helper reads the instructions that shipped with your app and takes it from there, one step at a time.

## Things you can ask for

You do not need to learn how the code works first. Start with plain requests:

- **"Set up my app."** First-time setup.
- **"Add payments."** Start taking money.
- **"Add sign-in and save data."** Accounts and saved information.
- **"Something is broken."** Run a checkup and fix the problem.
- **"Put my app online."** Publish the latest version.

VybeKiit is built so the helper can decide the technical steps and explain only what you need to do.

## What the kit handles

- A real web app starting point.
- Instructions for AI coding helpers.
- Paths for checkout, sign-in, saved information, and going live.
- A local checkup so the helper can verify the app before moving on.
- Shared pieces the kit can keep improving over time.

You should expect to describe your product, review the result, and approve account or browser steps when needed. You should not have to understand the code before your app can move forward.

## What you need

You need [Node.js](https://nodejs.org/en) 20 or newer. The setup command uses a one-line starter that runs the VybeKiit helper tool for you.

To get your purchased app files, VybeKiit uses a small access tool from GitHub. If it is not ready yet, the kit tells you what to install or sign in to.

## For agents and maintainers

This folder also holds the instructions and code used to build the kit itself. If you are an agent or maintainer working inside this project, read these first:

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
