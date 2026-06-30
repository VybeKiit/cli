---
name: configure-capabilities
description: the app has **only the permissions it needs** — the builder never thinks about Info.plist, Android manifest, or Expo plugins. Use when the builder says something like: camera; location permission; notifications permission.
metadata:
  vybekiit-generated: buyer-skill-stub
---

<!-- vybekiit:generated:buyer-skill-stub -->

# Skill: configure-capabilities

**Goal:** the app has **only the permissions it needs** — the builder never thinks about Info.plist, Android manifest, or Expo plugins.

**Contract:** invisible to the builder · verify-before-advance · plain language if App Store / Play review needs a human step.

> (Agent-only) Read `expo-deployment` / platform skills. Apply **least privilege** — Apple and Google expect minimal permissions with clear purpose strings for reviewers (agent writes those strings; builder does not edit them).

## When to run

- Adding camera, photos, location, notifications, Bluetooth, background modes, etc.
- Before EAS build / store submit if `app.json` may be stale vs features shipped

## Steps

1. Inventory features and native APIs used in the codebase.
2. Add only required Expo config plugins and permission entries.
3. Write App Store / Play purpose strings where required (agent-only, factual).
4. **Verify:** `pnpm typecheck`; config matches shipped features.

## Definition of done

`app.json` / native config matches shipped features with minimum permissions; builder was not asked to choose permission names.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
