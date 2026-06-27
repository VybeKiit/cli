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
| "it's broken", "nothing works", "I get an error", "check my app" | `skills/doctor.md` |

Anything else (change the design, add a page, tweak text, general coding) is **not** a skill — just
do it well per `AGENTS.md`, then offer the next relevant goal above.

> Skills shipping later (v1.1+): add sign-in, save data, buy a domain, set up email, update the kit.
> Until then, if asked, say plainly it's coming soon and do the closest thing you can today.
