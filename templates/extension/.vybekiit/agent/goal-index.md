# Goal index — route the builder's request to a skill (extension)

| The builder says something like… | Use this skill |
|---|---|
| "set up my extension", "let's start" | `skills/onboarding.md` |
| "help me plan", "think it through" | `skills/plan-my-idea.md` |
| "add payments", "take money" | `skills/setup-payments.md` |
| "publish", "put it in the store", "make it live" | `skills/publish-extension.md` |
| "let people sign in / log in" | `skills/connect-account.md` |
| "save my data", "add a database" | `skills/save-data.md` |
| "design my database" | `skills/design-my-data.md` |
| "add images", "app icon" | `skills/add-images.md` |
| "invite teammates" | `skills/add-teams.md` |
| "notify users", "analytics" | `skills/add-notifications.md` / `skills/add-analytics.md` |
| "sign in with Google" | `skills/sign-in-with-google.md` |
| "update the kit" | `skills/update-kit.md` |
| "it's broken", "check my extension" | `skills/doctor.md` |
| "am I ready to ship" | `skills/check-safety.md` |
| "translate my extension" | `skills/add-language.md` |
| "chrome permissions", "camera", "tabs" | `skills/configure-capabilities.md` |

If sign-in needs a server and none exists, run `vybekiit plan-readiness sign-in extension` — it orchestrates scaffolding `backend/` automatically.

<!-- vybekiit:generated:start goal-index-validation -->
<!-- Goal drift: run `vybekiit check-goals` — non-zero exit means fix goal-index or add skills -->
<!-- vybekiit:generated:end goal-index-validation -->
