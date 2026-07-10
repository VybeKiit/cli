# Skill: add-teams

**Goal:** the builder can invite teammates and work in shared organizations.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate. You design and wire the org model; the builder describes who should
have access.

> (Under the hood — agent-only) Orgs via `@vybekiit/tenancy` → `resolveTenancyProvider()` first;
> then extend UI. Follow `platform-skills/better-auth-vybekiit.md` when auth wiring is needed.

## Steps

<!-- vybekiit:page-recipe-install -->
0. **Page recipe (catalog SSOT — Option C; Tier-1 already shipped).**
   Web ships interactive teams at `src/components/saas/teams.tsx` → `/dashboard/teams`.
   Prefer that surface. Richer catalog reference: `apps/componentLibrary/src/pageRecipes/TeamsPage.tsx`
   export `TeamsPage` (recipe id `teams`). Need admin user/role screens? Install catalog ids
   `admin-panel` via `getPageRecipeInstall('admin-panel')`.
   Also reference `packages/agentKit` `getPageRecipeInstall('add-teams')` / page-recipe-manifest.json.
   **Verify:** `/dashboard/teams` renders with practice invite UI before provider wiring.

1. **Confirm sign-in works first.** If `add-signin` is not done, run that skill first — teams need
   accounts.
   **Verify:** a user can sign in.

2. **Agree on the team shape, in plain words.** Ask who can invite whom (e.g. "the owner invites
   people by email"). You decide the data model; they confirm the behavior.
   **Verify:** read the behavior back in one sentence and get a yes.

3. **Use the shipped interactive teams surface (Tier-1).** Do not invent a blank page. Keep every
   `TODO(vybekiit)` seam and wire it in the next step.
   **Verify:** `/dashboard/teams` renders and can send a practice invite.

4. **Wire organizations and invites.** Run `vybekiit apply-preset organizations`, then wire invite
   flow through `@vybekiit/tenancy` → `resolveTenancyProvider()`. Replace each
   `TODO(vybekiit)` in the teams feature page.
   **Verify:** `vybekiit verify-presets organizations` passes; code builds.

5. **Test end-to-end.** Write a test that creates an org, adds a member, and reads membership.
   **Verify:** test green. 🎉 *Celebrate* — they can invite teammates.

## If anything breaks

Run `doctor`. Common cause: sign-in not wired, or migration not applied.

## Definition of done

Owner can invite a teammate by email, the invite is stored, and a passing test covers org membership.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
