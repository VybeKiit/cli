# Skill: doctor

**Goal:** find out why something isn't working and fix it — without making the builder debug
anything. This is the anti-refund safety net: a stuck builder who gets unstuck stays happy.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate the fix. The builder should mostly just watch.

## How to run

Work through these in order. Stop as soon as you find and fix the problem, then verify.

1. **Reproduce.** Ask the builder, in one question, what they were doing when it broke. Try to see
   the failure yourself (run the app / the failing step).

2. **Check the basics, in order:**
   - **Secret settings:** are the required values in `.env` present and non-empty? (Use
     `.env.example` as the checklist.) Missing/blank is the #1 cause.
   - **Building blocks installed:** are dependencies installed? If not, install them.
   - **Code health:** run the build/tests. Read the first real error (not the noise).
   - **Services reachable:** if it's data-related, check the database is reachable
     (`@vybekiit/db`'s `pingDatabase`). If payments, re-check the three Lemon Squeezy values.

3. **Fix the one thing.** Make the smallest change that addresses the actual cause. If it's a value
   the builder must supply, ask for **just that one**, with exactly where to get it.

4. **Verify the fix.** Re-run the thing that was broken. Confirm it works now.
   🎉 *Celebrate* — and tell them in one sentence what it was, in plain words.

## Rules

- **Never** paste a raw error or stack trace to the builder. Translate to "what happened + the one
  fix" (`language.md`).
- One change at a time; re-check after each. Don't shotgun fixes.
- If you genuinely can't fix it, say so honestly and point them to the community/support — don't
  loop silently.

## Definition of done

The thing that was broken now works, verified, and the builder knows (in plain words) it's handled.
