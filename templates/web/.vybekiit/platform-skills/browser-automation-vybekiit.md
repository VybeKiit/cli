# Platform wrapper: browser automation

**Agent-only.** Dashboard Playwright CLI for providers without API or MCP coverage.

## Package

`@vybekiit/browser-automation` — bin: **`vybekiit-automate`**

| Target | Profile | Purpose |
|--------|---------|---------|
| `ls` | `$HOME/.ls-chrome-profile` | Lemon Squeezy (fresh-squeezy) |
| `cws` | `$HOME/.cws-chrome-profile` | Chrome Web Store extension publish |

## CLI modes

**Agent mode** — non-interactive, structured stdout:

```bash
vybekiit-automate ls setup --json --name "Pro" --price-cents 2900 --mode test --webhook-url "https://…"
vybekiit-automate ls standby --json
vybekiit-automate cws publish --json   # CWS verbs also exported programmatically
```

Flags: `--json` (never prompt), `--yes` (skip confirms), `CI=1` or non-TTY requires all flags.

**Wizard mode** — TTY + missing flags → `@clack/prompts` interactive flow.

## Rules

- **Blind navigation only** — selectors/DOM; never send dashboard screenshots to the model
- Builder **signs in only** for LS; agent runs all other steps
- Never say "Playwright", "DOM", "browser automation", or "fresh-squeezy" to the builder

## Legacy

`@vybekiit/extension-publish` re-exports CWS target; prefer `@vybekiit/browser-automation`.
