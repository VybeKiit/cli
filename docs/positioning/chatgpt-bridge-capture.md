# ChatGPT bridge capture — landing direction review

> Captured via `bridge ask` on 2026-06-28 after fixing `readComposerText` (composer-clear detection).
> Source command: see `docs/positioning/bridge-inspiration-prompt.md`.

## Direction review

| Slug | Specific UI enhancement | Why it fits agent-as-operator |
|------|-------------------------|-------------------------------|
| `terminal-to-live` | Live “agent log” rail: each command → human outcome (“Configured payments” → “Deployed checkout” → “Live URL ready”) | Agent feels like an operator executing production steps, not a chatbot giving advice |
| `split-screen` | Interactive split: left “You alone” friction cards, right “You + agent” outcomes, draggable divider | Shows the agent removing operational burden |
| `three-platform` | One central product prompt feeding three synced preview cards (Web, Mobile, Extension) | Agent coordinates one instruction into multiple shipped platforms |
| `receipt-mor` | Checkout receipt timeline: Customer pays → tax handled → payout ready, MoR stamped | Proves the product handles commercial operations, not just code |
| `directors-chair` | Director’s board: plain-English direction → agent handles auth, payments, hosting, updates | Buyer directs; agent runs production |
| `checklist` | Verification states: done, tested, deployed, payment confirmed — not static checkmarks | Operator verifies before advancing; accountable, not a chatbot |
| `vibe-coder` | Plain-language prompt bubble converts into polished app preview + payment toast | Describe the product; agent operates the build |
| `before-after` | Slider: Day 1 idea → Session 1 live app taking payments, real URL chip | Sells the transformation, not the technical process |
| `quiet-stack` | Stack muted in background; only live product highlighted in full color | Agent manages hidden infrastructure |
| `bold-statement` | Proof strip under headline: “Builds · Deploys · Wires payments · Maintains updates” | Bold claim backed by named operator tasks |

## Top 3 A/B test picks

### 1. `before-after`
Best for conversion — outcome instantly legible: idea → live paying product. Clearest for non-developers who only need the transformation, not the stack.

### 2. `checklist`
Strongest trust-builder — agent feels systematic, safe, production-ready. Verification matters because buyers fear “AI builds it” means messy or unreliable.

### 3. `directors-chair`
Most brandable, least generic — memorable mental model: you direct, the agent operates. Turns VybeKiit from “another starter kit” into clear role separation.
