# Skill: sign-in-with-google

**Goal:** people can tap **Continue with Google** — one button that signs them in **or** creates
their account. By the end, new and returning users both reach the dashboard.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate. You wire all the code; the builder only approves when a step
needs it.

> (Under the hood — agent-only) Web uses better-auth Google social provider. Mobile and extension
> send a Google token to your backend verifier endpoint — see their platform skills.

## Steps

1. **Make sure the basics exist.** Database (`save-data`) and base sign-in (`add-signin`) must work
   first — Google builds on top.
   **Verify:** a real email/password account can sign up and reach the dashboard.

2. **Set up the tools.** Run `vybekiit doctor` — it installs `gcloud` and checks you're signed in.
   If it says "not signed in yet," walk the builder through the one command it prints.
   **Verify:** doctor reports gcloud ready.

3. **Create the Google login for your app.** Use `gcloud` to create a **Web application** OAuth client.
   Write `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, and `GOOGLE_OAUTH_REDIRECT_URI`
   to `.env`. Never ask the builder to open the Google Cloud console.
   **Verify:** all three values are non-empty in `.env`.

4. **Enable Google on the sign-in handler.** Follow `platform-skills/better-auth-vybekiit.md` — add
   the Google social provider to the auth route. One flow handles sign-in and sign-up.
   **Verify:** the app builds; the Google button appears on login.

5. **Add the token verifier for phone + extension.** Extend the auth API so mobile (`expo-auth-session`)
   and extension (`chrome.identity`) can POST a Google ID token and receive a session. Same user
   record for all platforms.
   **Verify:** a test token exchange returns a session (or a clear error when misconfigured).

6. **Try it for real.** Sign in with Google on the web — new account and returning user both work.
   🎉 *Celebrate* — people can now use Google in one tap.

## Definition of done

Continue with Google works on web (sign-in and sign-up); backend verifier exists for mobile/extension;
`GOOGLE_OAUTH_*` populated; doctor green on gcloud.
