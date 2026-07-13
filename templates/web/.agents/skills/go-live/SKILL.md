---
name: go-live
description: the builder's app is online at a real web address that anyone can open. Use when the builder says something like: put it online; publish; make it live; ship it; deploy.
metadata:
  vybekiit-generated: buyer-skill-stub
---

<!-- vybekiit:generated:buyer-skill-stub -->

# Skill: go-live

**Goal:** the builder's app is online at a real web address that anyone can open.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate. You handle the deploy; the builder only approves/pastes when
asked.

> (Under the hood — agent-only) Prefer **Live work host** (ADR-0039): run
> `vybekiit live-work host` so preference ladder, free-tier hop, and pin live in `@vybekiit/deploy`
> — never reimplement hop here. Fallback only: `resolveHosting()` + platform wrappers in
> `.vybekiit/platform-skills/` (`deploy-cloudflare-vybekiit.md`, `deploy-vercel-vybekiit.md`,
> `deploy-railway-vybekiit.md`). Pick the host from their settings; don't make the builder choose
> or hear the host's name (unless they ask).

## Steps

<!-- vybekiit:page-recipe-install -->
0. **Install the page recipe first (catalog SSOT — Option C).**
   Copy `apps/componentLibrary/src/pageRecipes/LaunchChecklistPage.tsx` export `LaunchChecklistPage` into the buyer app at route `/dashboard/launch`.
   Recipe id: `launch-checklist`. Presets: job_runs.
   Keep every `TODO:` in the recipe and wire each one after the route renders.
   Also reference `packages/agentKit` `getPageRecipeInstall('go-live')` / page-recipe-manifest.json.
   **Verify:** route builds and shows practice UI before provider wiring.


1. **Pre-flight check.** Run `vybekiit doctor` to make sure the deploy tool is installed, then run
   the project's checks (tests + build) yourself. Asset optimization runs in `prebuild` / start hooks
   (`scripts/optimizeAssets.mjs`) — confirm it completes without errors. Run code-readiness greps from `check-safety`
   (step 6): `node scripts/checkNoConsole.mjs`, duplicate-helper scan, logger spot-check.
   Run **quality smoke**: `pnpm verify` (format, lint, typecheck, tests). Fix anything red before
   going online. Confirm production mode on the host will silence debug logs (`NODE_ENV=production`).
   If anything is red, fix it (or run `doctor`) **before** going online — never publish a broken app.
   **GEO pre-flight:** when the app has a blog or FAQ, confirm at least one public page includes JSON-LD
   (view-source on a blog post) and `/llms.txt` returns 200 with curated page paths.
   **Verify:** build passes locally, deploy tool installed, quality smoke green, no debug console noise,
   `/llms.txt` reachable when blog/FAQ content exists.

2. **Explain in one line.** *"I'm going to put your app online now. You'll click 'approve' once."*

3. **Put the app online.** Prefer the shared Live work path (ADR-0039) so preference ladder,
   free-tier hop, and pin stay in one place:
   - Run `vybekiit live-work host --mode=buyer --cwd=.` (add `--vendor=<name>` only when the
     builder named Cloudflare, Render, Railway, or Vercel; add `--build-dir=<path>` when a static
     export is ready for a first create).
   - On success, read the JSON `buyerMessage` out loud and share the live `url` when present.
     Pin keys are already written (`pinKeys` lists which names were written — never print values).
   - If it fails with missing credentials / ladder exhausted, fall back to `vybekiit doctor` and
     the matching platform wrapper in `.vybekiit/platform-skills/`. If doctor said the deploy tool
     isn't signed in, have the builder run the one sign-in command it printed — a browser window
     opens, they click "approve," and that's the only thing they do. Then create/connect/publish
     via the wrapper. Copy needed secret settings into the app's home (never paste secrets into
     chat or commit them).
   - If Live work returned an existing pin (`url` present) but the builder needs the **latest
     code** online, follow the platform wrapper for the pinned host to publish that build — Live
     work owns ladder/pin; wrappers own re-deploy of app code when create adapters don't cover it.
   **Verify:** Live work JSON has `"ok": true` and `"verified": true` and the live URL loads, or
   the platform wrapper finishes green and the URL loads.
   🎉 *Celebrate* — their app is live; give them the link to share.

4. **Verify the app's memory is up to date.** If the app saves data (`save-data` was run before),
   confirm the live database has the same structure as the local one — run the migration status check
   via `@vybekiit/db`'s `checkMigrationStatus()`. If pending migrations exist, apply them now.
   **Verify:** migration status shows all applied; no pending.

5. **Want their own web address?** If they'd like to use their own domain instead of the temporary
   address, run `buy-domain` next.

## If anything breaks

Run `doctor`. Most failures going online are a missing secret setting — add it for them and publish
again.

## Never

- Never offer a preview/staging deploy. The builder's "deploy" always means production. A preview URL confuses non-technical builders ("which one is real?") and wastes time.
- Never say "fixed" or "done" after a code change without deploying (contract rule ⑧). If the app is already live, ask to deploy or confirm the builder wants to wait.
- Never reimplement preference ladder / free-tier hop in this skill — always `vybekiit live-work host`
  (or package runner) first.

## Definition of done

The live URL loads the latest version of their app, and they have the link.

## After completing this skill

Update checklist.md Progress (mark done, note next).
Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
