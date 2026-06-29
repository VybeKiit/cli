# Goal index — route the builder's request to a skill

The builder speaks in goals, not commands. Match what they say to a skill below and follow it
exactly. When in doubt between two, pick `onboarding` (it routes onward). Every skill follows the
shared rules in `AGENTS.md`: one action at a time · verify-before-advance · plain language ·
translate errors · celebrate.

| The builder says something like… | Use this skill |
|---|---|
| "set up my extension", "I just bought this", "let's start", "get it going" | `skills/onboarding.md` |
| "help me plan", "I'm not sure what I want", "think it through with me", "figure out my idea first" | `skills/plan-my-idea.md` |
| big vague feature ("build me a shopping helper", "like Honey but for…") before specifics | `skills/plan-my-idea.md` |
| "publish", "put it in the store", "ship it", "submit my extension", "go live" | `skills/publish-extension.md` |
| "let people sign in / log in / create accounts" | `skills/connect-account.md` |
| "save my data", "remember this", "store info" | `skills/save-data.md` |
| "add my icon", "extension icon", "add images" | `skills/add-images.md` |
| "add payments", "let me take money", "sell something" | `skills/setup-payments.md` |
| "invite teammates", "add my team", "work with others" | `skills/add-teams.md` |
| "notify users", "send alerts" | `skills/add-notifications.md` |
| "see who uses my app", "visitor stats", "analytics" | `skills/add-analytics.md` |
| "update the kit", "get the latest", "upgrade" | `skills/update-kit.md` |
| "it's broken", "nothing works", "I get an error", "check my extension" | `skills/doctor.md` |
| "am I ready to ship", "did we cover security", "is my extension safe" | `skills/check-safety.md` |
| "sign in with Google", "sign up with Google", "Continue with Google" | `skills/sign-in-with-google.md` |
| "make it Hebrew", "translate my app", "add Spanish", "speak my language" | `skills/add-language.md` |
| "set it up", "finish setup", "wire it up", "make it work" | grep `TODO(vybekiit)`, then run each named skill — see `AGENTS.md` → *Wire-up markers* |

Anything else (change the design, add a popup page, tweak text) is **not** a skill — just do it well
per `AGENTS.md`, then offer the next relevant goal above.

> This is a browser extension: sign-in, saved data, and payments live on the builder's **backend**
> (their web app). The extension connects to it — it holds no secret keys. Never name Chrome, WXT,
> or MV3 to the builder (see `language.md`).
