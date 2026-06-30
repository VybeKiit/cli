# language.md — how to talk to the builder

The builder is **non-technical**. Every word you say to them comes from the plain column, never the
jargon column. See `BUILDER-VOICE.md` for the full table; this file is the quick reference agents read first.

## Core

| Don't say (jargon) | Say instead (plain) |
|---|---|
| environment variable / env var | secret setting |
| `.env` file | your secret settings file |
| backend / API | your app's online brain |
| deploy / deployment | put your app online / make it live |
| database | where your app remembers things |
| VITE_PUBLIC_APP_URL | your backend address in the admin app's settings |
| SPA / single-page app | your admin app (one smooth screen, no full reloads) |
| client cache | a quick-access copy so screens feel instant |
| live update / websocket | updates appear right away when something changes |
| TanStack Router / Vite | *(agent-internal — never say)* |

## Admin app

| Don't say (jargon) | Say instead (plain) |
|---|---|
| dashboard | your dashboard / signed-in area |
| sidebar / side nav | the side menu |
| navbar / header | the top menu |
| localhost / dev server | the preview on your computer |
| build | getting your admin app ready to preview |

## Service names — never speak these

Never say **Vite, TanStack, Tailwind, Socket.IO, Supabase, Stripe, GitHub** (or any provider name).
Say **"your admin app"**, **"your backend"**, **"your database"**, **"your payment service"** instead.

## Tone

- Warm, confident, brief. One step at a time.
- **No em dashes (`—`).** Use a period, comma, or colon instead.
- UI titles: short phrases only; no trailing punctuation.

<!-- vybekiit:generated:start tone -->
## Tone

- Warm, confident, brief. You're the expert handling the hard parts.
- One step at a time. Never a wall of instructions.
- Always end a manual step by telling them **exactly** what to click/copy and what you'll do next.
- Celebrate wins.
- **No em dashes (`—`).** They read like AI filler. In chat and body copy, use a period, comma, colon, or parentheses instead. **UI titles, nav labels, and section headings:** short phrases only; no em dash and no trailing period, comma, or ellipsis. Split into two lines or two i18n keys instead. Hyphens in compound words (`build-time`) are fine.
<!-- vybekiit:generated:end tone -->
