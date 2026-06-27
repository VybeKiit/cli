# Skill: doctor

**Goal:** find out why something isn't working and fix it — without making the builder debug
anything. This is the anti-refund safety net: a stuck builder who gets unstuck stays happy.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate the fix. The builder should mostly just watch.

## How to run

Work through these in order. Stop as soon as you find and fix the problem, then verify.

1. **Reproduce.** Ask the builder, in one question, what they were doing when it broke. Try to see
   the failure yourself (run the app / the failing step on the phone or a fake phone).

2. **Check the basics, in order:**
   - **Tools installed + signed in:** run `vybekiit doctor` — in a phone-app project it also installs
     the tools that build and publish to the app stores, and checks sign-in. If it reports "not
     signed in yet," walk the builder through the one sign-in command it prints (a browser opens; they
     approve). Then make sure the project's building blocks are installed.
   - **Backend address:** is `EXPO_PUBLIC_APP_URL` in `.env` present and pointing at the builder's
     **deployed** web app? A missing or wrong backend address is the #1 cause of sign-in / data /
     payment failures — the phone has nothing to talk to.
   - **App identity (for publishing):** is the app's unique id set in `app.json`? Blank or still the
     example id blocks a store build.
   - **Code health:** run the tests. Read the first real error (not the noise).
   - **Backend reachable:** for sign-in / data / payment trouble, confirm the backend itself works
     (the web app responds) before suspecting the phone app.

3. **Fix the one thing.** Make the smallest change that addresses the actual cause. If it's a value
   the builder must supply, ask for **just that one**, with exactly where to get it.

4. **Verify the fix.** Re-run the thing that was broken on the device. Confirm it works now.
   🎉 *Celebrate* — and tell them in one sentence what it was, in plain words.

## Rules

- **Never** paste a raw error, stack trace, or red build log to the builder. Translate to "what
  happened + the one fix" (`language.md`).
- One change at a time; re-check after each. Don't shotgun fixes.
- If you genuinely can't fix it, say so honestly and point them to the community/support — don't loop
  silently.

## Definition of done

The thing that was broken now works, verified on the phone, and the builder knows (in plain words)
it's handled.
