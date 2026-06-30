# Goal index — route the builder's request to a skill (mobile)

| The builder says something like… | Use this skill |
|---|---|
| "set up my app", "let's start", "get me going" | `skills/onboarding.md` |
| "help me plan", "think it through" | `skills/plan-my-idea.md` |
| "add payments", "take money", "charge people" | `skills/setup-payments.md` |
| "put it online", "publish", "make it live", "ship it" | `skills/publish-app.md` |
| "let people sign in / log in / create accounts" | `skills/connect-account.md` |
| "save my data", "remember this", "add a database" | `skills/save-data.md` |
| "design my database", "what should my app remember" | `skills/design-my-data.md` |
| "let users upload", "store files" | `skills/add-files.md` |
| "add my logo", "app icon", "add images" | `skills/add-images.md` |
| "invite teammates", "add my team" | `skills/add-teams.md` |
| "notify users", "send alerts" | `skills/add-notifications.md` |
| "visitor stats", "analytics" | `skills/add-analytics.md` |
| "sign in with Google" | `skills/sign-in-with-google.md` |
| "update the kit", "get the latest" | `skills/update-kit.md` |
| "it's broken", "check my app" | `skills/doctor.md` |
| "am I ready to ship", "is my app safe" | `skills/check-safety.md` |
| "tell me when things break", "error alerts" | `skills/track-errors.md` |
| "save my code", "back up", "put it on GitHub" | `skills/back-up-my-code.md` |
| "translate my app", "add Spanish", "make it Hebrew" | `skills/add-language.md` |
| "camera", "location", "notifications permission" | `skills/configure-capabilities.md` |
| "set it up", "wire it up" | grep `TODO(vybekiit)`, run each named skill |

If sign-in or payments need a server and none exists, run `vybekiit plan-readiness sign-in mobile` — it orchestrates scaffolding `backend/` automatically.

<!-- vybekiit:generated:start goal-index-validation -->
<!-- Goal drift: run `vybekiit check-goals` — non-zero exit means fix goal-index or add skills -->
<!-- vybekiit:generated:end goal-index-validation -->
