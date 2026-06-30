# Goal index — route the builder's request to a skill (SPA admin app)

| The builder says something like… | Use this skill |
|---|---|
| "set up my app", "let's start", "get me going" | `skills/onboarding.md` |
| "help me plan", "think it through", "figure out my idea first" | `skills/plan-my-idea.md` |
| "add payments", "take money", "sell something" | `skills/setup-payments.md` |
| "put it online", "publish", "make it live", "deploy" | `skills/go-live.md` |
| "let people sign in / log in / create accounts" | `skills/connect-account.md` |
| "save my data", "add a database", "remember this" | `skills/save-data.md` |
| "design my database", "what should my app remember" | `skills/design-my-data.md` |
| "add my logo", "hero image", "add images" | `skills/add-images.md` |
| "invite teammates", "add my team" | `skills/add-teams.md` |
| "notify users", "send alerts" | `skills/add-notifications.md` |
| "visitor stats", "analytics", "who uses my app" | `skills/add-analytics.md` |
| "sign in with Google" | `skills/sign-in-with-google.md` |
| "update the kit", "get the latest" | `skills/update-kit.md` |
| "it's broken", "check my app", "nothing works" | `skills/doctor.md` |
| "am I ready to ship", "is my app safe" | `skills/check-safety.md` |
| "tell me when things break", "error alerts" | `skills/track-errors.md` |
| "save my code", "back up my project" | `skills/back-up-my-code.md` |
| "translate my app", "add Spanish", "make it Hebrew" | `skills/add-language.md` |
| "set it up", "finish setup", "wire it up", "make it work" | grep `TODO(vybekiit)`, then run each named skill — see `AGENTS.md` → *Wire-up markers* |

If sign-in needs a backend and none exists, run `vybekiit plan-readiness sign-in spa` — it orchestrates scaffolding `backend/` automatically.

<!-- vybekiit:generated:start goal-index-validation -->
<!-- Goal drift: run `vybekiit check-goals` — non-zero exit means fix goal-index or add skills -->
<!-- vybekiit:generated:end goal-index-validation -->
