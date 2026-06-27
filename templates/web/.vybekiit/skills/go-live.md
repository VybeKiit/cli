# Skill: go-live

**Goal:** the builder's app is online at a real web address that anyone can open.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate. You handle the deploy; the builder only approves/pastes when
asked.

> (Under the hood — agent-only) Put the app online via `@vybekiit/deploy`'s `resolveHosting()` —
> Cloudflare by default, AWS (Amplify) if the builder's setup uses it. Pick it from their settings;
> don't make the builder choose or hear the host's name (unless they ask).

## Steps

1. **Pre-flight check.** Run `vybekiit doctor` to make sure the deploy tool is installed, then run
   the project's checks (tests + build) yourself. If anything is red, fix it (or run `doctor`)
   **before** going online — never publish a broken app.
   **Verify:** build passes locally and the deploy tool is installed.

2. **Explain in one line.** *"I'm going to put your app online now. You'll click 'approve' once."*

3. **Sign in + connect the app's home.** If `vybekiit doctor` said the deploy tool isn't signed in,
   have the builder run the one sign-in command it printed — a browser window opens, they click
   "approve," and that's the only thing they do (this works the same whichever host their setup
   uses). Then you create the project and connect the app.
   **Verify:** the deploy tool reports they're signed in, and the project shows up.

4. **Move the secret settings over.** Copy the needed secret settings into the app's home for them
   (never paste secrets into chat or commit them).
   **Verify:** the required settings are present.

5. **Publish.** Put the app online.
   **Verify:** publishing finishes green and the live URL loads. Open it and confirm the page shows.
   🎉 *Celebrate* — their app is live; give them the link to share.

6. **Want their own web address?** If they'd like to use their own domain instead of the temporary
   address, run `buy-domain` next.

## If anything breaks

Run `doctor`. Most failures going online are a missing secret setting — add it for them and publish
again.

## Definition of done

The live URL loads the latest version of their app, and they have the link.
