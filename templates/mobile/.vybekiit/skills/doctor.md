# Skill: doctor

**Goal:** find out why something isn't working and fix it — without making the builder debug
anything. This is the anti-refund safety net: a stuck builder who gets unstuck stays happy.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate the fix. The builder should mostly just watch.

## How to run

Work through these in order. Stop as soon as you find and fix the problem, then verify.

1. **Reproduce.** Ask the builder, in one question, what they were doing when it broke — **unless**
   the prompt starts with `[VybeKiit Report]` or they used Report mode (tap the **R** button, tap the
   screen, send a note). In that case context is pre-filled; skip this question. Try to see the
   failure yourself (run the app / the failing step on the phone or a fake phone).

2. **Check the basics, in order:**
   - **Tools installed + signed in:** run `vybekiit doctor` — in a phone-app project it also installs
     the tools that build and publish to the app stores, and checks sign-in. If it reports "not
     signed in yet," walk the builder through the one sign-in command it prints (a browser opens; they
     approve). Then make sure the project's building blocks are installed.
   - **Backend address:** is `EXPO_PUBLIC_APP_URL` in `.env` present and pointing at the builder's
     **deployed** web app? A missing or wrong backend address is the #1 cause of sign-in / data /
     payment failures — the phone has nothing to talk to.
   - **Secret settings redaction:** doctor verifies `.cursorignore` lists `.env` — follow
     `env-secrets-vybekiit.md`; never read secret values aloud.
   - **App identity (for publishing):** is the app's unique id set in `app.json`? Blank or still the
     example id blocks a store build.
   - **Code health:** run `pnpm quality` (format, lint, typecheck, tests). Read the first real error (not the noise).
   - **Platform instructions stale?** If errors mention deprecated Expo or mobile patterns, run
     `update-kit` first — tell the builder *"I'll refresh my instructions first"* (never name Expo).
   - **Backend reachable:** for sign-in / data / payment trouble, confirm the backend itself works
     (the web app responds) before suspecting the phone app.

3. **Fix the one thing.** Make the smallest change that addresses the actual cause. If it's a value
   the builder must supply, ask for **just that one**, with exactly where to get it.

4. **Still stuck on generated code?** Follow the maintainer **diagnose** workflow internally — never
   expose that skill name to the builder.

5. **Verify the fix.** Re-run the thing that was broken on the device. Confirm it works now.
   🎉 *Celebrate* — and tell them in one sentence what it was, in plain words.

## Report Mode handoff

If the prompt starts with `[VybeKiit Report]` (or the builder used Report mode on the preview):

- Context is pre-filled — skip "what were you doing?"
- Use the route, tap coordinates, and builder note in the prompt
- Fix the smallest thing; verify; celebrate in plain words

## Rules

- **Never** paste a raw error, stack trace, or red build log to the builder. Translate to "what
  happened + the one fix" (`language.md`).
- One change at a time; re-check after each. Don't shotgun fixes.
- If you genuinely can't fix it, say so honestly and point them to the community/support — don't loop
  silently.

## Definition of done

The thing that was broken now works, verified on the phone, and the builder knows (in plain words)
it's handled.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*

