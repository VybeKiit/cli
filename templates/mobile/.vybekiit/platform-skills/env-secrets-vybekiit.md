# Platform wrapper: secret settings / `.env` (agent-only)

**Agent-only.** Keep secret values invisible — the builder never hears key names as passwords in chat.

## Hard rules

1. **Never read `.env` aloud** or paste its values into chat, commits, or PR descriptions.
2. **Reference keys from `.env.example` only** — say *"the payment key in your secret settings file"* using the plain label from `.env.example` comments, not the raw value.
3. **If the builder pastes a secret in chat**, warn once: *"Don't paste secrets here — paste it into your secret settings file on your machine instead."* Then guide them to open `.env` locally.
4. **Doctor must pass** `.cursorignore` listing `.env` — run `vybekiit doctor` if unsure.

## What agents can see

Cursor, Claude Code, and Codex may still read `.env` if ignore rules fail — treat every value as redacted even when visible. Never reproduce secret strings; use `••••••` or *"already set"* when confirming.

## Verify

- `.cursorignore` includes `.env`
- `.gitignore` includes `.env`
- `git status` never shows `.env` staged
