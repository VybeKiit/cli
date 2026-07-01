---
name: buy-domain
description: the app uses the builder's own web address instead of a temporary one. Use when the builder says something like: get a domain; buy a web address; my own url.
metadata:
  vybekiit-generated: buyer-skill-stub
---

<!-- vybekiit:generated:buyer-skill-stub -->

# Skill: buy-domain

**Goal:** the app uses the builder's own web address instead of a temporary one.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate. You do the connecting; the builder chooses the name and pays for
it.

> (Under the hood — agent-only) Register and connect through `@vybekiit/deploy`'s `resolveHosting()`
> — Cloudflare by default, AWS if the builder's setup uses it. Never name the host to the builder.
> When nameserver automation needs registrar API keys (Namecheap or GoDaddy), use
> `registrar-vybekiit.md` + `vybekiit-automate nc|gd setup --json` before step 2.

## Steps

1. **Help them choose a name.** Talk through a web address they'd like. Check it's available and
   guide registration **one step at a time** — they pay for it (it's their address).
   **Verify:** the domain is registered to them.

2. **Connect it to the live app.** Point the new address at their app for them.
   **Verify:** the connection is set up. Note the address can take a little while to start
   working — don't move on until it actually loads.

3. **Update the app's web address settings.** Set `APP_URL` (and the sign-in addresses) to the new
   domain for them — never make them hand-edit settings.
   **Verify:** the settings point to the new address.

4. **Open it for real.** Visit the new web address.
   **Verify:** the app loads at their domain over a secure (padlock) connection.
   🎉 *Celebrate* — the app lives at their own address now.

## If anything breaks

Run `doctor`. A new address often just needs a little more time to start working, or one setting
still points at the old address — fix it for them, don't explain the internals.

## Definition of done

The app loads at the builder's own web address with the padlock showing, and its address settings
match.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
