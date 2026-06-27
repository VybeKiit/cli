# Goal index — route the builder's request to a skill

The builder speaks in goals, not commands. Match what they say to a skill below and follow it
exactly. When in doubt between two, pick `onboarding` (it routes onward). Every skill follows the
shared rules in `AGENTS.md`: one action at a time · verify-before-advance · plain language ·
translate errors · celebrate.

| The builder says something like… | Use this skill |
|---|---|
| "set up my app", "I just bought this", "let's start", "get me going" | `skills/onboarding.md` |
| "add payments", "let me take money", "sell something", "charge people" | `skills/setup-payments.md` |
| "put it online", "publish", "make it live", "ship it", "deploy" | `skills/go-live.md` |
| "let people sign in / log in / create accounts / add users" | `skills/add-signin.md` |
| "save my data", "remember this", "store info", "add a database" | `skills/save-data.md` |
| "let users upload", "store files / images / attachments" | `skills/add-files.md` |
| "send emails", "email my users", "set up email" | `skills/setup-email.md` |
| "get a domain", "buy a web address", "use my own URL" | `skills/buy-domain.md` |
| "update the kit", "get the latest", "upgrade" | `skills/update-kit.md` |
| "it's broken", "nothing works", "I get an error", "check my app" | `skills/doctor.md` |
| "set it up", "finish setup", "wire it up", "make it work" | grep `TODO(vybekiit)`, then run each named skill — see `AGENTS.md` → *Wire-up markers* |

Anything else (change the design, add a page, tweak text, general coding) is **not** a skill — just
do it well per `AGENTS.md`, then offer the next relevant goal above.

> The sign-in, save-data, file-upload, email, domain, and update-the-kit goals are now shipping (no
> longer "coming soon") — each routes to its skill above. Each one routes to the right service under
> the hood; never name the service to the builder (see `language.md`).
