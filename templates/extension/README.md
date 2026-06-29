# Your browser extension

Built with **VybeKiit**. You don't need to read code to use this — just open the project
in Claude or Codex and tell it what you want to build.

The template ships a **WXT + React popup**, a background entrypoint, and the full **agent layer**
(skills, husky quality gate, CI). Point `WXT_PUBLIC_APP_URL` at your web app — sign-in, data, and
payments stay on that backend (extensions never hold secrets).

## Start here

Open this folder in your AI coding tool and say:

> **"Set up my extension."**

Your agent takes it from there — it reads its instructions, walks you through the few
steps only you can do (one at a time, in plain language), and gets your extension going.

## Things you can ask for

- "Set up my extension" — first-time setup.
- "Add sign-in" — let people log in (handled by your web app — extensions can't safely
  hold private keys). Say **"Sign in with Google"** for one-tap Google login.
- "Save data" — store what your users create.
- "Add payments" — start taking money.
- "Publish to the Chrome Web Store" — ship the latest version.
- "Something's broken" — your agent runs a checkup and fixes it.

Security (rate limits, blocking bad requests) lives on your **backend web app** — the extension
calls that server; you don't configure protection inside the extension itself.

That's it. Everything technical is handled for you.

---

<sub>For the agent: behavior is defined in [AGENTS.md](./AGENTS.md); skills live in `.vybekiit/`.</sub>
