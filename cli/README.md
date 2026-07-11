<p align="center">
  <img src="https://raw.githubusercontent.com/VybeKiit/vybekiit/main/assets/brand/vybekiit-profile.svg" width="160" height="160" alt="VybeKiit logo">
</p>

# vybekiit

Scaffold a VybeKiit kit workspace into your own folder, then build by describing what you
want to your AI coding agent (Claude Code, Codex, or Cursor). It does the heavy lift.

## Get started

After you purchase and accept the GitHub invite:

```sh
npx vybekiit setup
npx vybekiit create app --web
```

Or run `npx vybekiit` in a terminal for the interactive menu.

`create app --web|--mobile|--extension` builds a **kit workspace** (shared pieces + that
surface), not an app-only folder. Open the folder in your AI coding tool and say
`"Set up my app."` — the agent walks you through the rest one step at a time.

You do **not** need Download ZIP or the green Code button on GitHub for day-one setup.

`setup` / `doctor` install and check the full toolchain (agents, `gh`, cloud CLIs, skills,
assistant tools):

```sh
vybekiit doctor
```

`doctor` installs and checks your full toolchain and reports what's ready:

| Layer | Tools |
| ----- | ----- |
| Agent | `claude` (Claude Code), `codex` (OpenAI Codex), `skills` (platform skills installer) |
| Base | `gh` (download kit + GitHub login) |
| Default cloud | `supabase` (database), `wrangler` (hosting) |
| When configured | `aws`, `gcloud` (Google sign-in), `vercel`, `eas` + `launch` (mobile) |

Doctor reads your `.env` provider settings and only installs what you use. It also verifies
official platform skills are present under `.agents/skills/`. When you enable Google sign-in,
doctor installs and checks `gcloud` auth.

## Commands

```
vybekiit setup                              Welcome + full doctor + next step
vybekiit create app --web|--mobile|--extension [dir]
vybekiit doctor                             Full toolchain pass
vybekiit sync-agent-layer [template]        Refresh agent instructions

  -h, --help       Buyer help
  --help --all     Full command list
  -v, --version    Show the CLI version
```

Examples:

```sh
vybekiit setup
vybekiit create app --web my-app
vybekiit create app --mobile
vybekiit doctor
```

`vybekiit new` is deprecated; use `create app` instead.

## Maintainer contract

CLI command cores should return a structured result and let the entrypoint render once. Human output
goes to the normal terminal renderer; `--json` writes stable JSON to stdout; logs and status messages
stay on stderr or are suppressed for JSON mode. Prompt code belongs behind the interactive boundary
(`@clack/prompts`), never inside command core logic.

### Templates

| Template    | Stack                                  | Status         |
| ----------- | -------------------------------------- | -------------- |
| `web`       | Next.js + shadcn (RTL-ready) + agent layer | available  |
| `mobile`    | Expo + agent layer                     | available      |
| `extension` | WXT + agent layer                      | ships in v3    |

Every template ships the **agent layer** — the instructions and skills your AI agent
follows to set up, build, and ship your app.

## How delivery works

The paid product lives in gated private repos. The public npm package ships **no** template
files. When you run `create app`, the CLI uses GitHub's `gh` tool to download the gated
**kit** workspace (`VybeKiit/kit`: packages + templates), then writes your app folder.
One browser login via `gh auth login --web` — no tokens to create or paste.

Template-only mirrors (`web` / `mobile` / `extension`) remain for advanced flows; day-one
buyers always get a kit workspace so shared pieces resolve locally.

If you haven't signed in yet, the CLI tells you exactly what to run:
`gh auth login --web`. `doctor` installs `gh` for you.

## Requirements

- **Node.js 20+** (the project toolchain targets Node 22).
- Everything else — agent CLIs, `gh`, `supabase`, `wrangler`, `gcloud`, `aws` — is installed by `vybekiit doctor`.

## License

MIT.
