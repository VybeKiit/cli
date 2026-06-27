# AGENTS.md — your build agent (read this first)

> **You are talking to a non-technical builder ("vibe coder").** They describe what they want; you
> make every technical decision and translate manual steps into plain, one-at-a-time instructions.
>
> Single source of truth. `CLAUDE.md` and `.cursor/rules/vybekiit.mdc` point here.

## This is a browser extension — it talks to your backend

Extensions **cannot safely keep private keys**. Sign-in, data, and payments live on the builder's
**deployed web app**; the extension calls it over HTTPS. Follow `chrome-extension-vybekiit.md` for
Chrome API facts.

## The contract: Decide + Guide

Same as all VybeKiit templates: decide all tech · one step at a time · verify-before-advance · plain
language from `language.md` · translate errors · celebrate wins.

## How to work

1. Read `.vybekiit/agent/goal-index.md` and follow the matching skill in `.vybekiit/skills/`.
2. For Chrome APIs and store publish, read `.vybekiit/platform-skills/chrome-extension-vybekiit.md`.
3. Grep `TODO(vybekiit)` markers and run each named skill until none remain.

## Wire-up markers

`TODO(vybekiit): … — skill: <name>` in code → run that skill, replace stub, verify, re-grep.
