# Bridge prompt — VybeKiit CLI welcome banner concepts

## Runnable queue (10 terminal banner mockup images)

Generates **concept images** (terminal screenshots with ASCII-style art) for picking a direction before we implement real ANSI animation.

```bash
# Preview prompts (no browser)
node scripts/run-bridge-cli-banner-queue.mjs --dry-run

# Run all 10 (~several minutes each — batch with --from/--to)
node scripts/run-bridge-cli-banner-queue.mjs

# Single direction
node scripts/run-bridge-cli-banner-queue.mjs --only chevron-shimmer
node scripts/run-bridge-cli-banner-queue.mjs --only ship-launch
```

**Output:** `out/cli-banner-inspirations/<id>/`

**Prerequisites:**

```bash
node ../ai-browser-bridge/dist/bridge.js login --provider chatgpt
# Sign in in the isolated Chrome window; pick an image-capable model in ChatGPT.
```

Index: `docs/positioning/bridge-cli-banner-queue.json` · Art brief: `docs/positioning/cli-banner-direction.md`

**Note:** `bridge ask` alone returns text. This queue asks ChatGPT to **generate images**; `bridge download` saves attachments.

## After you pick a direction

1. Note the winning `slug` / `id`.
2. We trace the image into achievable `WELCOME_ART` lines + shimmer frames in `cli/src/ui/welcome-banner.ts`.
3. Re-run `vybekiit setup` in a real terminal to validate.
