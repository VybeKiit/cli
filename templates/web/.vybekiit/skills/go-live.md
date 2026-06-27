# Skill: go-live

**Goal:** the builder's app is online at a real web address that anyone can open.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate. You handle the deploy; the builder only approves/pastes when
asked.

> Where it goes: **Cloudflare Pages** — fast, free to start, no surprise bills (don't make the
> builder choose hosting).

## Steps

1. **Pre-flight check.** Run the project's checks (tests + build) yourself first. If anything is
   red, fix it (or run `doctor`) **before** going online — never publish a broken app.
   **Verify:** build passes locally.

2. **Explain in one line.** *"I'm going to put your app online now. You'll click 'approve' once."*

3. **Connect Cloudflare.** Guide them to sign in to Cloudflare (one step at a time). You create the
   Pages project and connect the app.
   **Verify:** Cloudflare shows the project.

4. **Move the secret settings over.** Copy the needed secret settings into Cloudflare for them
   (never paste secrets into chat or commit them). 
   **Verify:** the required settings are present in Cloudflare.

5. **Publish.** Trigger the deploy.
   **Verify:** the deploy finishes green and the live URL loads. Open it and confirm the page shows.
   🎉 *Celebrate* — their app is live; give them the link to share.

6. **If they bought a domain / want one.** (Domain skill ships later.) For now, give them the
   Cloudflare URL and note a custom domain is coming soon.

## If anything breaks

Run `doctor`. Most deploy failures are a missing secret setting — add it for them and re-publish.

## Definition of done

The live URL loads the latest version of their app, and they have the link.
