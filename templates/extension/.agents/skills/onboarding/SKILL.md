---
name: onboarding
description: take the builder from "I just bought this" to **their extension running in Chrome** in. Use when the builder says something like: set up my app; let's start; get me going; just bought.
metadata:
  vybekiit-generated: buyer-skill-stub
---

<!-- vybekiit:generated:buyer-skill-stub -->

# Skill: onboarding

**Goal:** take the builder from "I just bought this" to **their extension running in Chrome** in
this one session.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate.

> (Agent-only) Follow `.vybekiit/platform-skills/chrome-extension-vybekiit.md` for WXT + MV3 setup.

## Steps

1. **Welcome + ask the one thing that matters.** Ask what they want the add-on to do in one sentence.

1b. **One-time planning offer** (skip if `.vybekiit/state/planning-intro-seen` exists).
   Ask: *"Before we start building — want to **think it through together** first? I'll ask one question
   at a time until we're totally aligned. Or we can jump straight to building."*
   - **Yes** → run `plan-my-idea.md` with their one-sentence answer as seed; when done, continue to
     step 2.
   - **No** → continue to step 2.
   Create `.vybekiit/state/planning-intro-seen` (any content) so this offer never repeats.

2. **Set up tools and load a preview.** Run **`vybekiit setup`** (`vybekiit doctor` still works to
   re-check tools anytime), install deps, build/load unpacked in
   Chrome (Extensions → Developer mode → Load unpacked). Explain in plain words.
   **Verify:** popup or side panel opens without errors.

3. **Show them it works.** Walk them through opening the add-on once.
   **Verify:** they confirm they see it. 🎉 Celebrate.
   Mention Report mode once: *"If something in the popup looks wrong, press Option+Shift+R (or tap
   **Report**), click it, tell me what's off — I'll get the details automatically. Drag the dock or
   tap **Pin** to move it out of your way."*

4. **Make it theirs.** Tailor the starter UI to their one-sentence idea.
   **Verify:** preview reflects their idea.

5. **Offer next goals** via `goal-index.md`: publish → `publish-extension`, sign-in →
   `connect-account`, payments → `setup-payments`, save data → `save-data`.

## Definition of done

Builder saw their extension running locally and knows what to ask for next.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
