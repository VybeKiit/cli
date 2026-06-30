---
name: configure-capabilities
description: the extension or app has **only the permissions it needs** — the builder never thinks about manifest entries, Info.plist keys, or Android permissions. Use when the builder says something like: camera; location permission; notifications permission.
metadata:
  vybekiit-generated: buyer-skill-stub
---

<!-- vybekiit:generated:buyer-skill-stub -->

# Skill: configure-capabilities

**Goal:** the extension or app has **only the permissions it needs** — the builder never thinks about manifest entries, Info.plist keys, or Android permissions.

**Contract:** invisible to the builder · verify-before-advance · plain language if manual store approval is needed.

> (Agent-only) Read `chrome-extension-vybekiit.md` (extension) or Expo platform skills (mobile). Apply **least privilege** with a one-line agent-only rationale in code comments — never permission jargon to the builder.

## When to run

- Adding a feature that needs tabs, storage, notifications, camera, microphone, clipboard, etc.
- Before first publish / go-live if manifest or `app.json` may be stale vs features shipped

## Extension (WXT / MV3)

1. Inventory features in the codebase (content scripts, background, API usage).
2. Map each need to the **narrowest** Chrome permission or host permission pattern.
3. Update `wxt.config.ts` / manifest — remove unused permissions.
4. **Verify:** extension loads unpacked; only declared permissions appear in Chrome.

## Mobile (Expo)

1. Map features to the minimum Expo config plugins and native permissions.
2. Update `app.json` / `app.config.ts` — no broad `*` permissions.
3. **Verify:** `pnpm typecheck` and platform prebuild if applicable.

## Definition of done

Manifest / app config matches shipped features with minimum permissions; builder was not asked to choose permission names.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
