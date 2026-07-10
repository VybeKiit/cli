<p align="center">
  <img src="https://raw.githubusercontent.com/VybeKiit/vybekiit/main/assets/brand/vybekiit-profile.svg" width="160" height="160" alt="VybeKiit logo">
</p>

# vybekiit

Scaffold a VybeKiit template into your own repo, then build it by describing what you
want to your AI coding agent (Claude Code, Codex, or Cursor) — it does the heavy lift.

## Get started

```sh
npx vybekiit setup
npx vybekiit create app --web
```

Or run `npx vybekiit` in a terminal for the interactive menu.

`create app --web|--mobile|--extension` builds a kit workspace + that surface (not an
app-only folder). Open the folder in your AI coding tool and say `"Set up my app."` —
the agent walks you through the rest one step at a time.

`setup` / `doctor` install and check the full toolchain (agents, `gh`, cloud CLIs, skills,
assistant tools):

```sh
vybekiit doctor
```

`doctor` installs and checks your full toolchain and reports what's ready:

| Layer | Tools |
| ----- | ----- |
| Agent | `claude` (Claude Code), `codex` (OpenAI Codex), `skills` (platform skills installer) |
| Base | `gh` (download templates + GitHub login) |
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

Templates are proprietary and live in gated mirror repos; the published npm package ships
**no** template files. When you run `vybekiit new`, the CLI uses GitHub's `gh` CLI to access
the mirror you've purchased access to — one browser login, no tokens to create or paste.
The scaffold keeps the workspace dependency model from the gated monorepo; maintained
`@vybekiit/*` packages are private workspace code, not public npm packages rewritten at copy time.

If you haven't signed in yet, the CLI tells you exactly what to run:
`gh auth login --web`. `doctor` installs `gh` for you.

## Requirements

- **Node.js 20+** (the project toolchain targets Node 22).
- Everything else — agent CLIs, `gh`, `supabase`, `wrangler`, `gcloud`, `aws` — is installed by `vybekiit doctor`.

## License

MIT.
