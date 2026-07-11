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

## Start here (after you purchase)

You do **not** need the green **Code** button on GitHub, and you should **not** use **Download ZIP**.

1. Accept the GitHub invite email (same account you used at checkout).
2. Install [Node.js](https://nodejs.org/en) 20 or newer if you do not have it.
3. In Terminal, run:

```bash
npx vybekiit setup
npx vybekiit create app --web
```

(Mobile: `--mobile`. Browser add-on: `--extension`.)

4. Open the **new folder** the command created in your AI coding tool.
5. Paste the ready prompt below (or simply say **Set up my app.**).

## Ready prompt for your AI coding tool

Open your new app folder in [Claude Code](https://code.claude.com/docs/en/overview), [Codex](https://developers.openai.com/codex/quickstart), [Cursor](https://cursor.com/docs), Grok, Kimi, Roo, [Zed](https://zed.dev/), Kiro, [GitHub Copilot](https://github.com/features/copilot), or any other AI coding tool, then paste:

```text
Set up my app.

I am a non-technical vibe coder. Read AGENTS.md and language.md.
Speak plain language. One action at a time. Translate any errors.
Celebrate progress. Do not dump technical steps on me.

Start with first-time setup until I can see my app running on my computer.
```

### Prefer the helper to drive from the invite only?

After you accept the invite and have Node installed, paste this anywhere:

```text
I just bought VybeKiit. I accepted the GitHub invite. I am non-technical.

Do everything for me:
1. Check Node is installed (need 20 or newer).
2. Run: npx vybekiit setup
3. If GitHub login is needed, tell me the ONE click to do, then continue.
4. Run: npx vybekiit create app --web
5. Open the new project and run first-time setup until I can open the app in my browser.
6. Talk to me in plain language. One step at a time. No jargon.
```

## Things you can ask for

You do not need to learn how the code works first. Start with plain requests:

- **"Set up my app."** First-time setup.
- **"Add payments."** Start taking money.
- **"Add sign-in and save data."** Accounts and saved information.
- **"Something is broken."** Run a checkup and fix the problem.
- **"Put my app online."** Publish the latest version.

VybeKiit is built so the helper can decide the technical steps and explain only what you need to do.

## What the kit handles

- A real web app starting point (plus mobile and browser add-on when you need them).
- Instructions for AI coding helpers.
- Paths for checkout, sign-in, saved information, and going live.
- A local checkup so the helper can verify the app before moving on.
- Shared pieces the kit can keep improving over time.

You should expect to describe your product, review the result, and approve account or browser steps when needed. You should not have to understand the code before your app can move forward.

## What you need

- [Node.js](https://nodejs.org/en) 20 or newer.
- A paid VybeKiit invite on GitHub (automatic after checkout at [vybekiit.com](https://vybekiit.com)).
- An AI coding tool you like.

To download your paid kit pieces, the starter uses a small GitHub access tool. If it is not ready yet, `npx vybekiit setup` / `doctor` tells you what to install or sign in to.

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
