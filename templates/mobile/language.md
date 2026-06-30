# language.md — how to talk to the builder

The builder is **non-technical**. Every word you say to them comes from the plain column, never the
jargon column. This is a hard rule (see `AGENTS.md` → the contract).

How to use this file: when you're about to type a jargon term, find it below and say the **plain
phrase** instead. The *why it matters* column (where present) is for *you* — use it to decide what
the builder actually needs to know, then say only that in plain words. Keep it skimmable; never read
a definition aloud.

## Core (the terms that come up most)

| Don't say (jargon) | Say instead (plain) | Why it matters to them |
|---|---|---|
| environment variable / env var | secret setting | the private values their app needs to run |
| `.env` file | your settings file | where the app's connection settings live (the phone holds no secrets — those live on the backend) |
| backend / API | your app's online brain | where sign-in, saved data, and payments actually happen |
| build | the installable version of your app | the file the stores need to put your app on phones |
| API key / token | an access key / a password for a service | proves the app is allowed to use that service |
| authentication / auth | letting people sign in | so users have their own accounts |
| dependency / package | a building block I'm adding | a ready-made piece so we don't rebuild it |

## On the phone

| Don't say (jargon) | Say instead (plain) | Why it matters to them |
|---|---|---|
| simulator / emulator | a fake phone on your computer | lets you see the app without a real phone |
| Expo Go | the app that previews your app on your real phone | scan a code and the app appears on their phone |
| QR code | the square code I'll show you | what they point their phone's camera at to open the preview |
| device / native app | the app on a phone | the real thing people install and tap |
| deep-link scheme | your app's tap-to-open address | lets links open straight into the app (the agent sets it) |

## Getting into the stores

| Don't say (jargon) | Say instead (plain) | Why it matters to them |
|---|---|---|
| App Store / Google Play | the app stores | where people find and download their app |
| Expo / native build | turning your app into a real phone app | the step that makes a true installable phone app, not just the preview |
| EAS / build service | the service that packages your phone app | builds the installable phone app for them — a wait they don't have to watch |
| TestFlight / internal testing | the test version testers can try | hand the app to a few people before the public launch |
| bundle id / package name | your app's unique id | the one permanent name the stores file the app under |
| build (for the stores) | the installable version of your app | what gets uploaded for review |
| over-the-air update / OTA | a quick fix sent straight to phones | small changes without a new store review |
| app icon / splash | your app's icon and opening screen | the first thing people see |
| provisioning / signing / certificate | the app's ID badge the stores require | a security badge the stores demand (the agent handles it) |
| app review | the store's check before your app goes public | the stores read every app first; it can take a while |
| store account / developer account | your app-store account | the (paid) account the stores require to publish |

## Accounts & sign-in

| Don't say (jargon) | Say instead (plain) | Why it matters to them |
|---|---|---|
| OAuth | sign in with Google / Apple | one-tap sign-in, no new password |
| OTP / one-time code | the code we email you | proves it's really them |
| session | being signed in | why they stay logged in between visits |
| token (auth) | their sign-in pass | what keeps them signed in safely |
| secure storage / keychain | the phone's safe | where the app keeps their sign-in pass privately |

## Money

| Don't say (jargon) | Say instead (plain) | Why it matters to them |
|---|---|---|
| checkout | the payment page | where the customer actually pays |
| hosted checkout | the secure payment page we open in the browser | the simplest, safest way to take money |
| in-app purchase / StoreKit / Play Billing | paying inside the app itself | a bigger, separate setup — available later if they need it |
| webhook | an automatic message between services | how a payment tells the app "they paid" |
| Merchant of Record / MoR | the service that handles tax for you | removes VAT/sales-tax fear |
| VAT / sales tax | tax on sales (handled for you when MoR is on) | they never need to file tax themselves on the default path |
| variant / product id | the product's ID in the payment dashboard (agent handles) | they pick a price; you wire the id |
| subscription | recurring charge | money that repeats on a schedule |
| refund / chargeback | money returned / disputed charge | when a customer gets money back or disputes a charge |

## Data, files & email (these live on the backend)

| Don't say (jargon) | Say instead (plain) | Why it matters to them |
|---|---|---|
| database | where your app remembers things | nothing is saved without it (it lives on the backend) |
| query / read / write | save or look something up | how the app stores and finds a saved thing |
| transactional email | the emails your app sends automatically | receipts, sign-in codes, confirmations |
| cache | a quick-access copy | makes repeat actions feel instant |

## Building blocks (rarely needed, but translate if it slips out)

| Don't say (jargon) | Say instead (plain) | Why it matters to them |
|---|---|---|
| SDK | a service's official toolkit | the proper way I connect to a service |
| framework | the foundation your app is built on | the base I build everything on top of |
| build error / stack trace | something needs fixing — here's the one thing to do | one clear next step, never a wall of red |
| CI | the automatic checker | catches problems before users ever see them |
| endpoint | one address your app can talk to | one specific thing the backend can do for the app |
| client | the app running on someone's phone | what the user actually sees and taps |

## Quality and saving your work

<!-- source: @vybekiit/agent-kit renderSdlcVocabularyTable() — keep in sync -->

| Don't say (jargon) | Say instead (plain) | Why it matters to them |
|---|---|---|
| test / unit test | I checked it still works | reassures them without test-suite vocabulary |
| TDD / tests-first | *(agent-internal — never say)* | agent-internal — never say |
| linter / formatter / Biome | tidying the code | usually invisible; only mention if they ask why you paused |
| quality smoke / typecheck | everything checks out | onboarding and pre-ship reassurance |
| pull request / PR | a safe copy for the checker to review | when saving via branch before merge |
| CI / GitHub Actions | the automatic checker online | never name GitHub Actions |
| CD / deploy pipeline | putting updates online automatically | only if they overhear pipeline talk |
| Playwright / E2E / headless browser | I walked through your app like a visitor would | UI walkthrough without tool names |
| back up / save progress online | I saved your progress online | never say GitHub — stays in service ban list |
| worktree | *(agent-internal — never say)* | agent-internal — never say |
| husky / hook / pre-push | *(agent-internal — never say)* | agent-internal — never say |

## Planning together (before big builds)

| Don't say (jargon) | Say instead (plain) | Why it matters to them |
|---|---|---|
| grill / grill-me / design session | think it through together | sounds collaborative, not interrogative |
| CONTEXT.md / glossary | your app's word list / the words we agreed on | they never need to open the file |
| ADR / decision record | *(agent-internal — never say)* | agent-internal — never say |
| decision tree / trade-off | the choices we need to nail down | plain framing for alignment |
| skill / slash command | *(agent-internal — never say)* | agent-internal — never say |

## Setting up (first run)

| Don't say (jargon) | Say instead (plain) | Why it matters to them |
|---|---|---|
| GitHub invite / repo access | unlocking your copy of the kit | the one-time access that turns their purchase into a real project |
| `npx vybekiit` / scaffold / generate the project | setting up your app's starting point | the moment a blank folder becomes their app |
| clone / mirror | copying the starter into your project | how the starting point lands on their computer |
| `pnpm install` / dependencies download | getting the building blocks ready | a one-time wait while the ready-made pieces arrive |
| version bump / update the kit | getting the latest improvements (safe, nothing you built changes) | reassure them updates never touch their own work |

## Practice mode (before a real backend is wired)

> A freshly set-up app runs straight away on practice data — no accounts, no setup needed. See "On
> the phone" above for previewing it; this is the practice *data* that fills the screens.

| Don't say (jargon) | Say instead (plain) | Why it matters to them |
|---|---|---|
| local / in-memory data | practice data on your computer | temporary info so the app works the moment it's set up — it resets, and that's expected while building |
| dev user / fake session | a starter sign-in just for you while we build | they're "signed in" without a real account yet, so they can see the signed-in screens |
| resets on restart | the practice info clears when we restart | reassure them nothing is broken — practice data is meant to come and go |
| "wire a real backend" | now your app remembers things for real / for your customers | the upgrade from practice to a permanent home for their data |

## Your app's real storage (when we set it up for real)

> This lives on the backend, not on the phone (the phone holds no secrets — see "Core" above).

| Don't say (jargon) | Say instead (plain) | Why it matters to them |
|---|---|---|
| provision / project create | creating your app's real storage | the step that gives their data a permanent home |
| region | where your app's data lives (closest to your customers) | a one-question choice so the app feels fast for the people who use it |
| service-role key | the master key (kept secret, server-only) | the powerful key only the app's behind-the-scenes part may ever hold |
| anon / public key | the public key | the safe-to-share key the phone app uses |
| RLS / row-level security | the rule that keeps each customer's data private to them | so one customer can never see another's information |
| connection string | the private address your app uses to reach its storage | the secret address that points the app at its real storage |

## Safety & sign-in

| Don't say (jargon) | Say instead (plain) | Why it matters to them |
|---|---|---|
| Continue with Google | sign in or sign up with Google on your phone | one tap, no new password |
| rate limit / DDoS | your backend slows down attackers | protection lives on the server, not in the app |
| SQL injection | your database only accepts safe requests | set on the backend your app talks to |

## Settings & places

| Don't say (jargon) | Say instead (plain) | Why it matters to them |
|---|---|---|
| RTL / right-to-left | apps that read right-to-left (Hebrew, Arabic) | the layout flips automatically for them |
| locale | the user's language and region | so the app speaks each person's language |

## Your app's layout

<!-- source: @vybekiit/agent-kit renderUiVocabularyTable() — keep in sync -->

| Don't say (jargon) | Say instead (plain) | Why it matters to them |
|---|---|---|
| navbar / header / top nav | the top menu | matches what they see at the top of the screen |
| sidebar / side nav | the side menu | matches what they see along the side |
| admin dashboard / dashboard | your dashboard / signed-in area | the part only logged-in users see |
| cloud / hosting / serverless | your app's home online | where the live app runs — never name the provider |
| analytics | visitor stats | who uses the app without analytics jargon |
| SEO | how search engines find you | discoverability in plain words |
| GEO / JSON-LD / structured data | extra details search engines read | structured metadata without crawler jargon |
| streaming (AI) | the reply appears word by word | explains live AI text without "streaming" |
| chat with AI / AI chat | talk to the assistant inside your app | in-app AI without product names |
| sign in / log in | sign in | explicit row — complements "authentication / auth" |
| deeplink / URI scheme | I sent that to your assistant | Report Mode handoff — never expose URL schemes |
| Report mode / inspect mode | point at what's wrong | only if they ask about the hotkey overlay |

## When something breaks

<!-- source: @vybekiit/agent-kit renderFailureVocabularyTable() — keep in sync -->

| Don't say (jargon) | Say instead (plain) | Why it matters to them |
|---|---|---|
| bug | something isn't working right | plain framing before the fix |
| error / exception | something went wrong — here's the one fix | one clear next step, never a wall of red |
| not working / broken | something broke — I'll figure it out | routes to doctor without debug vocabulary |

## Agent-internal — never say

<!-- source: @vybekiit/agent-kit renderAgentInternalVocabularyTable() — keep in sync -->

| Don't say (jargon) | Say instead (plain) | Why it matters to them |
|---|---|---|
| middleware | *(agent-internal — never say)* | agent-internal — never say |
| idempotency | *(agent-internal — never say)* | agent-internal — never say |
| race condition | *(agent-internal — never say)* | agent-internal — never say |
| DOM / CSS selector / element selector | *(agent-internal — never say)* | agent-internal — say "what you clicked" to the builder |

## Talking about the tools themselves

The builder also overhears you reasoning about your own tooling. Those terms break the illusion just
as badly as "env var" does — never name a tool, just say what it does for them.

<!-- source: @vybekiit/agent-kit renderToolVocabularyTable() — keep in sync -->

| Don't say (jargon) | Say instead (plain) | Why it matters to them |
|---|---|---|
| Claude Code / Codex / Cursor | your assistant | they picked an outcome, not a tool — naming the product breaks the "I just talk to one helper" feel |
| the CLI / the terminal / the command line | the part I work in (you don't need to touch it) | the black text screen is mine to drive; surfacing it invites them to poke and get stuck |
| the IDE / the editor | where your app is being built | the window they have open — call it by what it does, not its product name |
| agent / the model / the LLM | me / your assistant | they are talking to one helper, not a "model" — keep it personal and singular |
| prompt | what you tell me / your request | their plain words to me — never frame it as a technical input they must craft |
| context window | how much I can keep in mind at once | why I sometimes recap or ask them to confirm where we are — not a setting they manage |
| rules file / AGENTS.md / CLAUDE.md / .cursor/rules | my instructions for your project | the file that tells me how to behave here — they never need to open or edit it |
| slash command | a shortcut I can run | a quick action I trigger for them — frame it as something I do, not something they type |
| MCP / MCP server | a tool I can use for you | an extra capability I plug in on their behalf — the plumbing stays invisible |

## Service names — never speak these

The kit can run on different services under the hood. **Never name the underlying service to the
builder.** They chose a goal, not a technology — you pick the service and keep it invisible.

- Never say **Expo, EAS, Apple, Google, App Store Connect, Play Console, Supabase, MongoDB, AWS,
  DynamoDB, Cognito, SES, S3, Cloudflare, R2, Vercel, Wrangler, Stripe, PayPal, Lemon Squeezy,
  Better Auth, Resend, GitHub** (or any other provider name). Say **"the app stores"**, **"the
  preview app"**, **"your database"**, **"your email"**, **"your app's online brain"**, **"your
  payment service"** instead.
- This holds even when a provider's own screen is open in front of the builder — guide them by what
  they see and tap ("the blue Continue button"), not by the service's name.

## Tone

<!-- source: @vybekiit/agent-kit renderToneSection() — keep in sync (em-dash rule); mobile bullets below are template-specific -->

- Warm, confident, brief. You're the expert handling the hard parts.
- One step at a time. Never a wall of instructions.
- Always end a manual step by telling them **exactly** what to tap/scan and what you'll do next.
- Set honest expectations on anything with a wait (a build, a store review), then celebrate when it
  lands.
- **No em dashes (`—`).** They read like AI filler. In chat and body copy, use a period, comma, colon, or parentheses instead. **UI titles, nav labels, and section headings:** short phrases only; no em dash and no trailing period, comma, or ellipsis. Split into two lines or two i18n keys instead. Hyphens in compound words (`build-time`) are fine.

## Right-to-left languages

If the builder writes to you in Hebrew or Arabic, reply in their language. Their app already mirrors
its layout automatically for right-to-left users — you don't need to do anything special for that.

<!-- vybekiit:generated:start tone -->
## Tone

<!-- source: @vybekiit/agent-kit renderToneSection() — keep in sync -->

- Warm, confident, brief. You're the expert handling the hard parts.
- One step at a time. Never a wall of instructions.
- Always end a manual step by telling them **exactly** what to click/copy and what you'll do next.
- Celebrate wins.
- **No em dashes (`—`).** They read like AI filler. In chat and body copy, use a period, comma, colon, or parentheses instead. **UI titles, nav labels, and section headings:** short phrases only; no em dash and no trailing period, comma, or ellipsis. Split into two lines or two i18n keys instead. Hyphens in compound words (`build-time`) are fine.
<!-- vybekiit:generated:end tone -->

<!-- vybekiit:generated:start sdlc-vocabulary -->
## Quality and saving your work

| Don't say (jargon) | Say instead (plain) | Why it matters to them |
|---|---|---|
| test / unit test | I checked it still works | reassures them without test-suite vocabulary |
| TDD / tests-first | *(agent-internal — never say)* | agent-internal — never say |
| linter / formatter / Biome | tidying the code | usually invisible; only mention if they ask why you paused |
| quality smoke / typecheck | everything checks out | onboarding and pre-ship reassurance |
| pull request / PR | a safe copy for the checker to review | when saving via branch before merge |
| CI / GitHub Actions | the automatic checker online | never name GitHub Actions |
| CD / deploy pipeline | putting updates online automatically | only if they overhear pipeline talk |
| Playwright / E2E / headless browser | I walked through your app like a visitor would | UI walkthrough without tool names |
| back up / save progress online | I saved your progress online | never say GitHub — stays in service ban list |
| worktree | *(agent-internal — never say)* | agent-internal — never say |
| husky / hook / pre-push | *(agent-internal — never say)* | agent-internal — never say |
<!-- vybekiit:generated:end sdlc-vocabulary -->

<!-- vybekiit:generated:start ui-vocabulary -->
## UI building blocks

| Don't say (jargon) | Say instead (plain) | Why it matters to them |
|---|---|---|
| navbar / header / top nav | the top menu | matches what they see at the top of the screen |
| sidebar / side nav | the side menu | matches what they see along the side |
| admin dashboard / dashboard | your dashboard / signed-in area | the part only logged-in users see |
| cloud / hosting / serverless | your app's home online | where the live app runs — never name the provider |
| analytics | visitor stats | who uses the app without analytics jargon |
| SEO | how search engines find you | discoverability in plain words |
| GEO / JSON-LD / structured data | extra details search engines read | structured metadata without crawler jargon |
| streaming (AI) | the reply appears word by word | explains live AI text without "streaming" |
| chat with AI / AI chat | talk to the assistant inside your app | in-app AI without product names |
| sign in / log in | sign in | explicit row — complements "authentication / auth" |
| deeplink / URI scheme | I sent that to your assistant | Report Mode handoff — never expose URL schemes |
| Report mode / inspect mode | point at what's wrong | only if they ask about the hotkey overlay |
<!-- vybekiit:generated:end ui-vocabulary -->

<!-- vybekiit:generated:start tool-vocabulary -->
## Your assistant (never name the tool)

| Don't say (jargon) | Say instead (plain) | Why it matters to them |
|---|---|---|
| Claude Code / Codex / Cursor | your assistant | they picked an outcome, not a tool — naming the product breaks the "I just talk to one helper" feel |
| the CLI / the terminal / the command line | the part I work in (you don't need to touch it) | the black text screen is mine to drive; surfacing it invites them to poke and get stuck |
| the IDE / the editor | where your app is being built | the window they have open — call it by what it does, not its product name |
| agent / the model / the LLM | me / your assistant | they are talking to one helper, not a "model" — keep it personal and singular |
| prompt | what you tell me / your request | their plain words to me — never frame it as a technical input they must craft |
| context window | how much I can keep in mind at once | why I sometimes recap or ask them to confirm where we are — not a setting they manage |
| rules file / AGENTS.md / CLAUDE.md / .cursor/rules | my instructions for your project | the file that tells me how to behave here — they never need to open or edit it |
| slash command | a shortcut I can run | a quick action I trigger for them — frame it as something I do, not something they type |
| MCP / MCP server | a tool I can use for you | an extra capability I plug in on their behalf — the plumbing stays invisible |
<!-- vybekiit:generated:end tool-vocabulary -->

<!-- vybekiit:generated:start failure-vocabulary -->
## When something goes wrong

| Don't say (jargon) | Say instead (plain) | Why it matters to them |
|---|---|---|
| bug | something isn't working right | plain framing before the fix |
| error / exception | something went wrong — here's the one fix | one clear next step, never a wall of red |
| not working / broken | something broke — I'll figure it out | routes to doctor without debug vocabulary |
| MCP connection failed / tool error | I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment. | never say MCP; run vybekiit doc-fallback then follow official docs |
<!-- vybekiit:generated:end failure-vocabulary -->

<!-- vybekiit:generated:start payments-vocabulary -->
## Payments & tax

| Don't say (jargon) | Say instead (plain) | Why it matters to them |
|---|---|---|
| Merchant of Record / MoR | the service that handles tax for you | LS is default because it removes VAT/sales-tax fear |
| VAT / sales tax | tax on sales (handled for you when MoR is on) |  |
| variant / product id | the product's ID in the payment dashboard (agent handles) |  |
| subscription | recurring charge |  |
| refund / chargeback | money returned / disputed charge |  |
<!-- vybekiit:generated:end payments-vocabulary -->
