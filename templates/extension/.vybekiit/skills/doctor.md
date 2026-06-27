# Skill: doctor

**Goal:** find and fix what's broken without making the builder debug.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate.

## How to run

Work through these in order. Stop as soon as you find and fix the problem, then verify.

1. **Reproduce** — one plain question about what they were doing.

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

## Definition of done

Broken behavior fixed and verified in the browser add-on preview.
