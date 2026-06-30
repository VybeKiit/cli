---
name: add-analytics
description: the builder can see who uses their product. Use when the builder says something like: visitor stats; analytics; track usage.
metadata:
  vybekiit-generated: buyer-skill-stub
---

<!-- vybekiit:generated:buyer-skill-stub -->

# Skill: add-analytics

**Goal:** the builder can see who uses their product.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate.

> (Under the hood — agent-only) Run **web** `add-analytics` on the backend site. Optionally track
> add-on opens as events to the same stats project — say "visitor stats" only.

## Steps

1. **Web stats first.** Run **web** `add-analytics` on the deployed web app.
   **Verify:** stats show page views.

2. **Optional add-on events.** Fire an event when the popup opens if the builder wants add-on usage
   counted separately.
   **Verify:** event appears in stats.

## Definition of done

Visitor stats work; optional add-on usage events if requested.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
