# Skill: onboarding

**Goal:** take the builder from "I just bought this" to **their app running and visible in front of
them** in this one session. This is the keystone — the moment that proves the purchase was worth it.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate. Decide all technical choices yourself.

## Steps

1. **Welcome + ask the one thing that matters.**
   Greet warmly. Ask: *"In one sentence, what do you want to build?"* Use their answer to tailor the
   starter page later — don't turn it into a technical interview.

2. **Set up the tools, then get the preview running.**
   First run `vybekiit doctor` — it installs the tools the app will need (for the database and for
   putting the app online) so the builder never configures anything. It may say a tool "isn't signed
   in yet" — that's fine for now; sign-in happens later, only when a step needs it (one browser click
   each). Then install the project's building blocks and start the app yourself, in plain words.
   **Verify:** the dev server is up with no errors. If it fails → run `doctor`.

3. **Show them their app.**
   Give them the one link to open (`http://localhost:3000`) and tell them what they'll see.
   **Verify:** ask them to confirm they can see the page. Don't continue until they say yes.
   🎉 *Celebrate* — their app is alive.

4. **Make it theirs.**
   Edit the starter page to reflect the one sentence from step 1 (headline + intro). Keep it simple.
   **Verify:** the preview updated; they confirm it looks like their idea.

5. **Offer the next goal.**
   Ask what they want next and route via `goal-index.md`:
   - take money → `setup-payments`
   - put it online for real → `go-live`
   - let people sign in → `add-signin`
   - save their data → `save-data`

## If anything breaks

Stop the steps and run `doctor`. Never show a raw error — say what happened and the one fix.

## Definition of done

The builder has seen their own app running and personalized, and knows the next thing they can ask
for. Save progress for them (don't make them think about it).
