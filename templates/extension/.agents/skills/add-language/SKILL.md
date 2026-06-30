---
name: add-language
description: make the extension speak another language when the builder asks in plain words. Use when the builder says something like: translate my app; add spanish; make it hebrew.
metadata:
  vybekiit-generated: buyer-skill-stub
---

<!-- vybekiit:generated:buyer-skill-stub -->

# Skill: add-language

**Goal:** make the extension speak another language when the builder asks in plain words.

**Contract:** one action at a time · verify-before-advance · plain language · celebrate.
Follow `i18n-vybekiit.md` for technical steps.

## Steps

1. **Ask which language** — you pick the ISO code.
2. **Duplicate `_locales/en/`** → `public/_locales/{locale}/messages.json`; translate `message` fields.
3. **Rebuild** — `pnpm build`; reload extension in Chrome.
4. **RTL** — if RTL locale: confirm popup `dir` and layout.
5. **Verify** — builder sees popup (and toolbar name) in the new language.
6. **Celebrate** 🎉

## Definition of done

New `_locales/{locale}/` ships in build output; popup strings resolve; tests green.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
