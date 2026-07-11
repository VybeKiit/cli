<p align="center">
  <img src="https://raw.githubusercontent.com/VybeKiit/vybekiit/main/assets/brand/vybekiit-profile.svg" width="160" height="160" alt="VybeKiit logo">
</p>

<p align="center">
  <strong>For vibe coders.</strong> You do not need to be technical or understand the code. Open this project in an AI coding tool, paste the ready prompt below, and build one step at a time.
</p>

<p align="center">
  <strong>English</strong> ·
  <a href="README.he.md">עברית</a> ·
  <a href="README.ar.md">العربية</a> ·
  <a href="README.ru.md">Русский</a>
</p>

# Your browser add-on

Built with **VybeKiit**. This is your browser add-on starting point: the little window people open from their browser. You do not need to read code to use it. Tell your AI helper what you want to build.

Sign-in, saved information, and payments live on **your web app**. The add-on talks to that app and never holds secret settings.

## If you only got a GitHub invite

You are not done yet. On your computer, run:

```sh
npx vybekiit setup
npx vybekiit create app --extension
```

Then open the **new folder** that command created (this template alone is not a full install).
Do **not** use Download ZIP from GitHub.

## Ready prompt for your AI coding tool

Open this project in [Claude Code](https://code.claude.com/docs/en/overview), [Codex](https://developers.openai.com/codex/quickstart), [Cursor](https://cursor.com/docs), Grok, Kimi, Roo, [Zed](https://zed.dev/), Kiro, [GitHub Copilot](https://github.com/features/copilot), or any other AI coding tool, then paste:

```text
Set up my browser add-on.

I am a non-technical vibe coder. Read AGENTS.md and language.md.
Speak plain language. One action at a time. Translate any errors.
Celebrate progress. Do not dump technical steps on me.

Start with first-time setup until I can preview the add-on on my computer.
```

## Start here

Open this folder in your AI coding tool and say:

> **"Set up my browser add-on."**

Your helper takes it from there. It reads its instructions, walks you through the few steps only you can do (one at a time, in plain language), and gets your add-on going.

## Things you can ask for

- **"Set up my browser add-on"**: first-time setup.
- **"Add sign-in"**: let people log in (handled by your web app; the add-on does not keep private keys). Say **"Sign in with Google"** for one-tap Google login.
- **"Save data"**: store what your users create (on your web app).
- **"Add payments"**: start taking money (on your web app).
- **"Publish to the extension store"**: ship the latest version.
- **"Something's broken"**: your helper runs a checkup and fixes it.

Safety checks (slowing abuse, blocking bad requests) live on your **web app**. The add-on calls that app; you do not set those up inside the add-on itself.

That's it. Everything technical is handled for you.

---

<sub>For the agent: behavior is defined in [AGENTS.md](./AGENTS.md); skills live in `.vybekiit/`.</sub>
