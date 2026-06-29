# Goal index — route the builder's request to a skill

The builder speaks in goals, not commands. Match what they say to a skill below and follow it
exactly. When in doubt between two, pick `onboarding` (it routes onward). Every skill follows the
shared rules in `AGENTS.md`: one action at a time · verify-before-advance · plain language ·
translate errors · celebrate.

| The builder says something like… | Use this skill |
|---|---|
| "set up my app", "I just bought this", "let's start", "get me going" | `skills/onboarding.md` |
| "help me plan", "I'm not sure what I want", "think it through with me", "figure out my idea first" | `skills/plan-my-idea.md` |
| big vague feature ("build me a marketplace", "I want something like Airbnb") before specifics | `skills/plan-my-idea.md` |
| "add payments", "let me take money", "sell something", "charge people" | `skills/setup-payments.md` |
| "put it online", "publish", "make it live", "ship it", "deploy" | `skills/go-live.md` |
| "let people sign in / log in / create accounts / add users" | `skills/add-signin.md` |
| "save my data", "remember this", "store info", "add a database" | `skills/save-data.md` |
| "what should my app remember", "design my database", "what data do I need", "map my features to data" | `skills/design-my-data.md` |
| "let users upload", "store files / images / attachments" | `skills/add-files.md` |
| "add my logo", "hero image", "app icon", "add images", "put my picture" | `skills/add-images.md` |
| "send emails", "email my users", "set up email" | `skills/setup-email.md` |
| "invite teammates", "add my team", "work with others", "organizations" | `skills/add-teams.md` |
| "notify users", "send alerts", "email when something happens" | `skills/add-notifications.md` |
| "see who uses my app", "visitor stats", "analytics", "track usage" | `skills/add-analytics.md` |
| "add AI", "smart replies", "chatbot", "AI helper" | `skills/add-ai.md` |
| "let users search", "find things", "search my data" | `skills/add-search.md` |
| "add a blog", "changelog", "write articles on my site" | `skills/add-blog.md` |
| "AI search", "ChatGPT find my site", "get quoted by Perplexity", "llms.txt", "answer engines" | `skills/add-blog.md` (content + GEO) or `skills/go-live.md` (verify `/llms.txt` live) |
| "get a domain", "buy a web address", "use my own URL" | `skills/buy-domain.md` |
| "update the kit", "get the latest", "upgrade" | `skills/update-kit.md` |
| "it's broken", "nothing works", "I get an error", "check my app" | `skills/doctor.md` |
| "lock down my app", "make it safe", "protect from abuse" | `skills/harden.md` |
| "sign in with Google", "sign up with Google", "Continue with Google" | `skills/sign-in-with-google.md` |
| "am I ready to ship", "did we cover security", "is my app safe" | `skills/check-safety.md` |
| "tell me when things break", "error alerts", "know if my app crashes" | `skills/track-errors.md` |
| "save my code", "back up my project", "put it on GitHub" | `skills/back-up-my-code.md` |
| "make it Hebrew", "translate my app", "add Spanish", "speak my language" | `skills/add-language.md` |
| "set it up", "finish setup", "wire it up", "make it work" | grep `TODO(vybekiit)`, then run each named skill — see `AGENTS.md` → *Wire-up markers* |

Anything else (change the design, add a page, tweak text, general coding) is **not** a skill — just
do it well per `AGENTS.md`, then offer the next relevant goal above.

> The sign-in, save-data, file-upload, email, domain, and update-the-kit goals are now shipping (no
> longer "coming soon") — each routes to its skill above. Each one routes to the right service under
> the hood; never name the service to the builder (see `language.md`).
