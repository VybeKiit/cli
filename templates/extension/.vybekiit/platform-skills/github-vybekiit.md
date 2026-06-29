# Platform wrapper: GitHub backup (agent-only)

**Agent-only.** Save the builder's project on GitHub — invoked by buyer skill `back-up-my-code`, not by git jargon.

## Prerequisites

- `gh` CLI installed (`vybekiit doctor` checks this)
- Builder has a **GitHub account** — `gh` does **not** create accounts. If they don't have one, walk them through signup at github.com one step at a time in plain language.

## Sign in

If doctor reports not signed in:

```bash
gh auth login --web
```

Browser opens → builder clicks approve.

## Backup flow

1. `git init` (if no repo yet) — `.gitignore` already ships
2. Stage all project files (never commit `.env` — it's gitignored)
3. First commit with a plain message, e.g. "Initial save"
4. Create **private** repo and push:

```bash
gh repo create <repo-name> --private --source=. --remote=origin --push
```

5. Open `https://github.com/<user>/<repo>` and confirm files are there
6. Give the builder the link in plain words — *"Your project is saved online here."*

## Later saves (PR flow)

For ongoing work after the first backup, use `ship-via-pr-vybekiit.md` — branch, push, wait for the **online checker** on all three operating systems, then merge. The builder hears *"Your latest work is saved and checked."*

## Rules

- Default to **private** repos unless the builder explicitly wants public
- Never paste secrets into commits or chat
- Never claim backup worked without verifying on github.com
- Do not run this in doctor by default — only when the builder asks or after meaningful progress (optional nudge in onboarding)

## Verify

`gh repo view` shows the remote · latest commit visible on GitHub · builder has the URL
