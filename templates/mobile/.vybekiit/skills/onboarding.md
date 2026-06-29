# Skill: onboarding

**Goal:** take the builder from "I just bought this" to **their app running on their own phone** in
this one session. This is the keystone — the moment that proves the purchase was worth it.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate. Decide all technical choices yourself.

## Steps

1. **Welcome + ask the one thing that matters.**
   Greet warmly. Ask: *"In one sentence, what do you want to build?"* Use their answer to tailor the
   home screen later — don't turn it into a technical interview.

1b. **One-time planning offer** (skip if `.vybekiit/state/planning-intro-seen` exists).
   Ask: *"Before we start building — want to **think it through together** first? I'll ask one question
   at a time until we're totally aligned. Or we can jump straight to building."*
   - **Yes** → run `plan-my-idea.md` with their one-sentence answer as seed; when done, continue to
     step 2.
   - **No** → continue to step 2.
   Create `.vybekiit/state/planning-intro-seen` (any content) so this offer never repeats.

2. **Set up the tools, then start the app.**
   First run `vybekiit doctor` — it installs the tools the app will need (including the ones that
   build and publish to the app stores) so the builder never configures anything. It may say a tool
   "isn't signed in yet" — that's fine for now; sign-in happens later, only when a step needs it.
   Then install the project's building blocks and start the app yourself, in plain words.
   After dependencies install, run **quality smoke** yourself: `pnpm quality`. Confirm `.cursorignore`
   hides `.env` (doctor checks this). Fix anything red before showing the preview code. The builder
   hears: *"Everything checks out."*
   **Verify:** the app starts with no errors and shows a code (a square QR) to scan.

3. **Get it onto their phone.**
   Tell them to install the free preview app on their phone, open it, and point the camera at the
   square code you're showing. (No real phone? Offer to open it on a fake phone on their computer
   instead.) Give this as **one** step — exactly what to tap.
   **Verify:** ask them to confirm the app opened on their phone. Don't continue until they say yes.
   🎉 *Celebrate* — their app is running in their hand.

4. **Make it theirs.**
   Edit the home screen to reflect the one sentence from step 1 (headline + intro). Keep it simple.
   **Verify:** the app updates on their phone live; they confirm it looks like their idea.

5. **Offer the next goal.**
   Ask what they want next and route via `goal-index.md`:
   - put it in the app stores → `publish-app`
   - let people sign in → `connect-account`
   - take money → `setup-payments`
   - remember things → `save-data`
   - save progress online → `back-up-my-code` (optional nudge after meaningful progress)

## If anything breaks

Stop the steps and run `doctor`. Never show a raw error — say what happened and the one fix. A code
that won't scan is usually the phone and computer not on the same Wi-Fi — fix that first.

## Definition of done

The builder has seen their own app running on their phone and personalized, and knows the next thing
they can ask for. Save progress for them (don't make them think about it).
