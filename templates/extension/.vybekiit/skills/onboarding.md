# Skill: onboarding

**Goal:** take the builder from "I just bought this" to **their extension running in Chrome** in
this one session.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate.

> (Agent-only) Follow `.vybekiit/platform-skills/chrome-extension-vybekiit.md` for WXT + MV3 setup.

## Steps

1. **Welcome + ask the one thing that matters.** Ask what they want the add-on to do in one sentence.

2. **Set up tools and load a preview.** Run `vybekiit doctor`, install deps, build/load unpacked in
   Chrome (Extensions → Developer mode → Load unpacked). Explain in plain words.
   **Verify:** popup or side panel opens without errors.

3. **Show them it works.** Walk them through opening the add-on once.
   **Verify:** they confirm they see it. 🎉 Celebrate.

4. **Make it theirs.** Tailor the starter UI to their one-sentence idea.
   **Verify:** preview reflects their idea.

5. **Offer next goals** via `goal-index.md`: publish → `publish-extension`, sign-in →
   `connect-account`, payments → `setup-payments`, save data → `save-data`.

## Definition of done

Builder saw their extension running locally and knows what to ask for next.
