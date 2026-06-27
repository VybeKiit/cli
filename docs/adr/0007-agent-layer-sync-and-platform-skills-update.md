# ADR-0007 — Agent-layer sync and platform skills update

- **Status:** Accepted
- **Date:** 2026-06-27
- **Deciders:** Yosef (owner), via Skills Bridge Complete plan

## Context

Buyers update the kit by saying "get the latest" — not by merging git or running maintainer scripts.
The original `update-kit` skill only bumped `@vybekiit/*` npm packages. Official upstream skills
(Expo, Vercel-labs) were pinned once with no buyer-facing refresh path. Agent instructions
(`.vybekiit/`, `AGENTS.md`, `language.md`) could drift from the template mirror.

A grill session locked **three update channels** inside one buyer skill, with maintainer CI re-pinning
upstream before mirror sync.

## Decision

1. **Three channels in `update-kit`** (buyer sees one goal):
   - **Channel 1 — npm:** `planKitUpdate()` bumps `@vybekiit/*` (unchanged semantics).
   - **Channel 2 — agent layer:** `vybekiit sync-agent-layer` clones the template mirror and copies
     only allowlisted paths.
   - **Channel 3 — platform skills:** `npx skills update -y` when `skills-lock.json` exists.

2. **Allowlist** (`AGENT_LAYER_PATHS` in `@vybekiit/agent-kit`):
   `.vybekiit/`, `AGENTS.md`, `CLAUDE.md`, `language.md`, `.cursor/rules/vybekiit.mdc`,
   `platform-skills.manifest.json`, `skills-lock.json`, `.agents/skills/`.
   Never `src/`, `.env`, or buyer customizations.

3. **Maintainer pin script:** `scripts/pin-platform-skills.mjs` reads per-template
   `platform-skills.manifest.json`, runs `npx skills add`, updates `skills-lock.json`. CI runs it
   before mirror sync.

4. **Planners in `@vybekiit/agent-kit`:** `planPlatformSkillsUpdate()`, `planAgentLayerSync()` —
   pure logic for skills/CLI; side effects stay in CLI and buyer skill steps.

5. **No background daemon** — all three channels run only when the builder asks to update the kit.

6. **`doctor` integration:** stale platform patterns → suggest `update-kit` first; deep scaffold bugs
   → maintainer `diagnose` workflow internally (never shipped as buyer skill).

## Consequences

- Buyers receive fresh agent instructions and pinned skill hashes on each release without touching app code.
- Published CLI needs `gh` auth for mirror clone (ADR-0005); monorepo dev uses local `templates/`.
- Cloudflare/web-perf official skills remain docs-only or maintainer-global until stable on skills.sh.
- `@vybekiit/agent-kit` grows shared vocabulary helpers (`domain-vocabulary.ts`) to reduce language drift.

## References

- ADR-0005 — template mirror distribution
- `scripts/pin-platform-skills.mjs`
- `cli/src/sync-agent-layer.ts`
