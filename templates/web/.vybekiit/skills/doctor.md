# Skill: doctor

**Goal:** find out why something isn't working and fix it — without making the builder debug
anything. This is the anti-refund safety net: a stuck builder who gets unstuck stays happy.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate the fix. The builder should mostly just watch.

## How to run

Work through these in order. Stop as soon as you find and fix the problem, then verify.

1. **Reproduce.** Ask the builder, in one question, what they were doing when it broke — **unless**
   the prompt starts with `[VybeKiit Report]` or they say they used Report mode (Option+Shift+R,
   clicked an element, sent a note). In that case context is pre-filled; skip this question.

2. **Check the basics, in order:**
   - **Secret settings:** are the required values in `.env` present and non-empty? (Use
     `.env.example` as the checklist.) Missing/blank is the #1 cause. Never read `.env` values aloud —
     follow `env-secrets-vybekiit.md`. Doctor verifies `.cursorignore` lists `.env`.
   - **Tools installed + signed in:** run `vybekiit doctor` — it installs your AI assistant (Claude Code,
     Codex, or Cursor), the skills installer, and whichever cloud tools your settings use (database, hosting,
     Google sign-in). It also checks official platform skills are present. If it reports "not signed
     in yet," walk the builder through the one sign-in command it prints (a browser window opens;
     they click approve). Then make sure the project's dependencies are installed.
   - **Code health:** run `pnpm verify` (format, lint, typecheck, tests). Read the first real error (not the noise).
   - **Platform instructions stale?** If symptoms match outdated framework patterns (old routing,
     deprecated APIs), suggest running `update-kit` before deep debugging — say *"I'll refresh my
     instructions first"* in plain words, never name upstream tools.
   - **Services reachable:** if it's data-related, check the database is reachable
     (`@vybekiit/db`'s `pingDatabase`). If payments, re-check payment secret values.
   - **Memory structure current?** If data-related errors (500, "column not found", "table missing"),
     check migration status first — a migration file that was never applied to the live database is
     the #1 silent killer after deploy. Run `checkMigrationStatus()` and apply pending migrations.
   - **MCP / integration stuck once?** Run `vybekiit doc-fallback <tech-id>` (see
     `.vybekiit/agent/tech-references.md`). Tell the builder you're checking the official setup
     guide — use the plain phrase from `formatBuilderStuckMessage()`, never say MCP.

3. **Fix the one thing.** Make the smallest change that addresses the actual cause. If it's a value
   the builder must supply, ask for **just that one**, with exactly where to get it.

4. **Still stuck on generated code?** If the fix lives in scaffolded kit code and basics are green,
   follow the maintainer **diagnose** workflow internally (`~/.claude/skills/diagnose/SKILL.md` or
   equivalent) — never expose that skill name to the builder. Translate the outcome to one plain fix.

5. **Verify the fix.** Re-run the thing that was broken. Confirm it works now.
   If the app is already online, ask: *"Want me to put this fix online now?"* (contract rule ⑧).
   Don't say "fixed" until the live URL reflects the change — or the builder said to wait.
   🎉 *Celebrate* — and tell them in one sentence what it was, in plain words.

## Report Mode handoff

If the prompt starts with `[VybeKiit Report]` (or the builder used Report mode on localhost):

- Context is pre-filled — skip "what were you doing?"
- Use the page, location in code, tap coordinates, and console errors in the prompt
- Fix the smallest thing; verify; celebrate in plain words

## Rules

- **Never** paste a raw error or stack trace to the builder. Translate to "what happened + the one
  fix" (`language.md`).
- One change at a time; re-check after each. Don't shotgun fixes.
- If you genuinely can't fix it, say so honestly and point them to the community/support — don't
  loop silently.

## Definition of done

The thing that was broken now works, verified, and the builder knows (in plain words) it's handled.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
