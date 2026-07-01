# Bridge prompt — VybeKiit landing inspirations (enrichment pass)

## Runnable queue (10 hero images)

Use the batch runner — one ChatGPT turn per direction, downloads to `out/landing-inspirations/`:

```bash
# Preview the list (no browser)
node scripts/runBridgeLandingQueue.mjs --dry-run

# Run all 10 (image model in ChatGPT; ~10min each — use --from/--to to batch)
node scripts/runBridgeLandingQueue.mjs

# Single direction
node scripts/runBridgeLandingQueue.mjs --only before-after
```

Index: `docs/positioning/bridge-landing-queue.json` · Prompts: `scripts/runBridgeLandingQueue.mjs`

**Note:** `bridge ask` alone prints text only. This queue asks ChatGPT to **generate images**; `bridge download` saves them. For **code** into the repo use `--tools` (separate pass).

---

## One-off enrichment prompt

Run after signing into ChatGPT in the bridge Chrome profile:

```bash
node /Users/yosefhayimsabag/Desktop/Code/ai-browser-bridge/dist/bridge.js login --provider chatgpt
# Sign in in the isolated Chrome window, then:

node /Users/yosefhayimsabag/Desktop/Code/ai-browser-bridge/dist/bridge.js ask @docs/positioning/landing-direction.md @apps/landing/src/data/inspirations.ts "
Review these 10 VybeKiit landing directions and the implemented inspiration routes.

For each slug, suggest ONE specific enhancement that would make it less generic SaaS and more memorable (micro-interaction, typography tweak, section addition, or mobile behavior).

Also rank the top 3 for A/B testing on vybekiit.com and explain why in 2 sentences each.

Output markdown only — no code unless it's a CSS one-liner.
" --repo /Users/yosefhayimsabag/Desktop/Code/vybekiit --fresh
```

Save the reply to `docs/positioning/inspiration-enrichment.md` for the next design pass.
