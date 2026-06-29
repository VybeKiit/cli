# Skill: back-up-my-code

**Goal:** the builder's project is saved on GitHub so they never lose work.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate. You handle git and GitHub; the builder only signs in or creates an account when asked.

> (Under the hood — agent-only) Follow `github-vybekiit.md`. Use `gh` only — never say "git init" or "remote" to the builder.

## Steps

1. **Explain in one line.** *"I'll save your project online so you can't lose it."*

2. **GitHub account.** If they don't have one, walk them through creating one at github.com — **one step at a time** in plain words. `gh` cannot create accounts for them.

3. **Sign in.** If `vybekiit doctor` says GitHub isn't signed in, run `gh auth login --web` and have them click approve in the browser.
   **Verify:** `gh auth status` shows signed in.

4. **Save it.** Initialize the repo (if needed), commit all safe files (never `.env`), create a **private** GitHub repo, and push.
   **Verify:** files visible on github.com.

5. **Give them the link.** Share the repo URL in plain words — *"Your project is saved here."*
   🎉 *Celebrate* — their work is backed up.

6. **Later saves.** For ongoing checkpoints, use `ship-via-pr-vybekiit.md` — the **online checker** runs on all three operating systems before merge. Builder hears: *"Your latest work is saved and checked."*

## If anything breaks

Run `doctor`. Common fixes: not signed in to GitHub, repo name already taken (pick another), or `.env` accidentally staged (unstage — secrets stay local).

## Definition of done

Project pushed to a private GitHub repo, verified on github.com, builder has the link.
