---
name: doctor
description: find and fix what's broken without making the builder debug. Use when the builder says something like: it's broken; nothing works; get an error; check my app.
metadata:
  vybekiit-generated: buyer-skill-stub
---

<!-- vybekiit:generated:buyer-skill-stub -->

# Skill: doctor

**Goal:** find and fix what's broken without making the builder debug.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate.

## How to run

Work through these in order. Stop as soon as you find and fix the problem, then verify.

1. **Reproduce** — one plain question about what they were doing — **unless** the prompt starts with
   `[VybeKiit Report]` or they used Report mode (Option+Shift+R in the popup, click an element, send
   a note). Skip the question when context is pre-filled.

2. **Check basics:**
   - `vybekiit doctor` — tools installed and signed in
   - Backend URL in config points at **deployed** web app
   - Extension loads in the browser without manifest errors
   - Tests green
   - **Platform instructions stale?** If errors look like outdated patterns, run `update-kit` first
     — say *"I'll refresh my instructions first"* (never name Chrome or WXT)

3. **Fix one thing** — smallest change; translate errors via `language.md`.

4. **Still stuck on generated code?** Follow the maintainer **diagnose** workflow internally — never
   expose that skill name to the builder.

5. **Verify** on the extension preview. 🎉 Celebrate.

## Report Mode handoff

If the prompt starts with `[VybeKiit Report]` (or the builder used Report mode in the popup):

- Context is pre-filled — skip "what were you doing?"
- Use the selector, accessible name, and console errors in the prompt
- Fix the smallest thing; verify; celebrate in plain words

## Definition of done

Broken behavior fixed and verified in the browser add-on preview.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
