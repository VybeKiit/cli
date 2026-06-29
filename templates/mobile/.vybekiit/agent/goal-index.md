# Goal index — route the builder's request to a skill

The builder speaks in goals, not commands. Match what they say to a skill below and follow it
exactly. When in doubt between two, pick `onboarding` (it routes onward). Every skill follows the
shared rules in `AGENTS.md`: one action at a time · verify-before-advance · plain language ·
translate errors · celebrate.

| The builder says something like… | Use this skill |
|---|---|
| "set up my app", "I just bought this", "let's start", "get it on my phone" | `skills/onboarding.md` |
| "help me plan", "I'm not sure what I want", "think it through with me", "figure out my idea first" | `skills/plan-my-idea.md` |
| big vague feature ("build me a fitness app", "I want something like Uber") before specifics | `skills/plan-my-idea.md` |
| "publish", "put it in the app store", "ship it", "submit my app", "go live" | `skills/publish-app.md` |
| "let people sign in / log in / create accounts / add users" | `skills/connect-account.md` |
| "save my data", "remember this", "store info", "add a database" | `skills/save-data.md` |
| "let users upload", "store files / images" | `skills/add-files.md` |
| "add my logo", "app icon", "splash screen", "add images" | `skills/add-images.md` |
| "add payments", "let me take money", "sell something", "charge people" | `skills/setup-payments.md` |
| "invite teammates", "add my team", "work with others" | `skills/add-teams.md` |
| "notify users", "send alerts", "email when something happens" | `skills/add-notifications.md` |
| "see who uses my app", "visitor stats", "analytics" | `skills/add-analytics.md` |
| "update the kit", "get the latest", "upgrade" | `skills/update-kit.md` |
| "it's broken", "nothing works", "I get an error", "check my app" | `skills/doctor.md` |
| "am I ready to ship", "did we cover security", "is my app safe" | `skills/check-safety.md` |
| "tell me when things break", "error alerts", "know if my app crashes" | `skills/track-errors.md` |
| "sign in with Google", "sign up with Google", "Continue with Google" | `skills/sign-in-with-google.md` |
| "save my code", "back up my project", "put it on GitHub" | `skills/back-up-my-code.md` |
| "make it Hebrew", "translate my app", "add Spanish", "speak my language" | `skills/add-language.md` |
| "set it up", "finish setup", "wire it up", "make it work" | grep `TODO(vybekiit)`, then run each named skill — see `AGENTS.md` → *Wire-up markers* |

Anything else (change the design, add a screen, tweak text, general coding) is **not** a skill — just
do it well per `AGENTS.md`, then offer the next relevant goal above.

> This is a phone app: sign-in, saved data, payments, and email live on the builder's **backend**
> (their web app), and the app connects to it — the phone holds no secrets. So `connect-account`,
> `save-data`, and `setup-payments` wire the app to that backend, and each one checks the backend has
> the feature first (pointing the builder to set it up on the web side if not). Each goal routes to
> the right service under the hood; never name the service to the builder (see `language.md`).
