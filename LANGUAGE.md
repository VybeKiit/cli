# LANGUAGE.md — VybeKiit

The human↔agent naming bridge: the exact word for each thing, and the aliases to avoid so code,
commits, skills, and docs all say the same thing. Names only — the *why* and the *shape* live in
[CONTEXT.md](./CONTEXT.md), the *how* in [CODE-STYLE.md](./CODE-STYLE.md).

Two voices share this vocabulary: the **maintainer** voice (this repo, technical) and the **buyer**
voice (inside `templates/*`, jargon-free). Where a term has a buyer-facing translation, it says so.

## Audience & identity

**Vibe coder** — the canonical buyer-facing identity: semi-technical, describes the product in plain
language, never reads diffs or operates git/deploy plumbing. Agents address them as "you" in speech
and use this term in maintainer docs when naming the human audience.
_Avoid_: builder (deprecated synonym — migrate to vibe coder); buyer in agent speech.

**Builder** — deprecated synonym for **Vibe coder**. Legacy templates and skills may still say
"builder"; migrate to vibe coder in buyer-facing copy. Do not use in new `language.md`/`AGENTS.md`.
_Avoid_: treating builder as a distinct role from vibe coder.

**Buyer** — commerce and legal identity: purchase, gate, refund, template delivery. Never spoken
aloud by the agent to the vibe coder; use "you" instead.
_Avoid_: calling the vibe coder "buyer" in chat.

## Architecture

**Owned** — app shell, all UI, and the buyer agent layer: files copied into the buyer's scaffolded
repo. The buyer edits freely; updates are frozen and never auto-clobbered. Examples: web/mobile/
extension templates, UI components, screens, buyer skills.
_Avoid_: maintained (see **Maintained**).

**Maintained** — headless logic shipped as public npm packages. The buyer never edits these
directly; updates flow as version bumps (conflict-free). Examples: core config, payments, auth, db,
client-state.
_Avoid_: owned (see **Owned**).

**Agent layer** — the skills, docs, and contracts that let Claude/Codex carry a vibe coder from
purchase to a live, money-making app — making every technical decision for them and translating
manual steps into plain language. Two layers, same filenames, different audiences: the **maintainer**
layer (repo root, technical) vs the **buyer** layer (inside templates, jargon-free, ships to buyers).

**Buyer layer** — the agent-facing docs and skills inside each template — goal-named skills,
`AGENTS.md`, and `language.md` for plain-language rules. Never speaks jargon to the vibe coder.

**Provider interface** — the per-concern contract (data, auth, hosting/deploy, storage, email,
payments) with swappable adapters and one default. Skills are written once against the interface, so
a new adapter never adds a skill.

**Adapter** — one concrete backend behind a concern's interface — the proven payments shape applied
everywhere: one interface, swappable backends, one default. The buyer never picks one; the agent
routes via one secret setting.
_Avoid_: provider (in buyer voice — say "the service your app uses", not "the MongoDB adapter").

**Local dev adapter** — the zero-config, in-memory `local` adapter for `@vybekiit/db` and
`@vybekiit/auth` that resolves **only when no backend is configured**, so a freshly scaffolded app
runs on the first `pnpm dev` (fake dev user, session-scoped data) — making the keystone (live in
session #1) real before any account exists. An explicit provider always wins; data resets on restart
by design (ADR-0008). In buyer voice it is "practice data" / "a starter sign-in".
_Avoid_: calling it a backend the buyer chooses (it is an invisible fallback, swapped out by
[[add-signin]] / [[save-data]]).

**Design tokens** — the one shared map of colors, spacing, radius, and type that web (as CSS vars)
and mobile (as StyleSheet values) both consume, so the two platforms look consistent.

## The contract & skills

**Decide + Guide** — the agent contract: make all technical decisions, guide the few steps only the
vibe coder can do (paste a key, approve a store submission) in exact plain-language,
one-step-at-a-time instructions. Promise: you never have to understand or decide; just follow simple
steps.

**Goal-named skill** — a buyer skill named for what the vibe coder wants ("go live", "save my
data"), never for the tech ("deploy to Cloudflare", "set up MongoDB"). Routes to the right adapter
underneath; the vibe coder never hears backend names. Adding a provider never adds a skill.
_Avoid_: tech-named skill, platform skill (Layer B names are agent-only).

**Platform skill** — Layer B execution knowledge: official upstream docs/skills plus thin VybeKiit
wrappers that wire provider resolution and verify-before-advance. Never shown to the builder.
_Avoid_: goal-named skill (Layer A is what the buyer asks for).

**Verify-before-advance** — every skill tests that a step worked before continuing. Prevents the
silent-stuck → refund death spiral.

**Skill gap** — a builder request with no matching `goal-index` row and no platform wrapper or
`@vybekiit/*` adapter that covers it. The agent fills gaps via `extend-capabilities-vybekiit`
(silent, agent-only).

**Extension skill** — an agent-authored skill created at runtime to fill a skill gap — stored
project-local under `.vybekiit/extensions/` or machine-global in the builder's tool-specific skills
folder.

**Machine-global skill** — a skill saved on the builder's computer, available across all their
projects on that machine — not VybeKiit-wide and not shared with other buyers.

**Official source fallback** — when MCP or the first debug attempt fails, the agent consults the
tech-references catalog (`vybekiit doc-fallback <tech-id>`) and tells the builder they are checking
the official setup guide — plain words only, never MCP or provider jargon.

**Tech reference** — an agent-kit catalog entry mapping a provider (Twilio, Supabase, better-auth,
etc.) to its official docs URL, optional MCP endpoint, and related secret-setting keys. Rendered into
`.vybekiit/agent/tech-references.md` for agents only.

**Generated section** — a markdown block rendered from `@vybekiit/agent-kit` on sync — bounded by
`<!-- vybekiit:generated:start … -->` markers so hand-authored prose is never clobbered.
_Avoid_: "you never see anything technical" (impossible and breeds refunds).

**Session bootstrap** — agent-only read-order file (`.vybekiit/agent/session-bootstrap.md`) listing
AGENTS → goal-index → skill → language → checklist append.

**Agent layer compliance** — mechanical checks (`vybekiit check-agent-layer`, pattern greps) that
keep skills, generated sections, and checklist structure aligned with the catalog.

**Production checklist** — an owned `checklist.md` per template tracking go-live gates (generated
block) plus an append-only decision log the agent updates after each completing skill.

**Decision log** — the append-only section at the bottom of `checklist.md` recording what changed,
from what, to what, and why — never deleted or regenerated by sync.

## Quality & guardrails

**Code hygiene guardrails** — invisible agent rules (AGENTS.md + Layer B) that prevent AI coding
anti-patterns — check-before-create, one lib file per concern, kit logger instead of `console.log`,
validation at API boundaries. Enforced at `check-safety` / `go-live` without a buyer-facing skill.

**SDLC guardrails** — the invisible agent quality loop: tests with every feature, Biome format/lint
after edits, kit hooks and React patterns, mobile-first web layout. Layer B skills
(`testing-vybekiit`, `format-lint-vybekiit`, `react-patterns-vybekiit`, `responsive-vybekiit`) plus
`pnpm verify` at onboarding and ship checks. The builder never runs vitest or the linter.

**Quality smoke** — agent-run `pnpm verify` (format → lint → typecheck → test) after first install
and before calling work done or shipping. Failures are fixed by the agent; Biome style warnings are
soft.

**Mobile-first** (web) — default layouts for narrow/phone width first, then scale up with `md:`/`lg:`
breakpoints. Preview at 375px before telling the builder a page is done.

**Agent push gate** — Husky **pre-push** in buyer templates — runs `pnpm verify` (and optional UI
walkthrough tests) when the **agent** pushes. The builder never hits it; it stops bad code before it
reaches the remote.

**Online checker** — buyer `.github/workflows/ci.yml`, the automatic checker on ubuntu/macOS/Windows.
Builder hears *"the automatic checker online"*, never CI/CD or GitHub Actions.

**Utility registry** — `src/lib/README.md` in each template: the agent-only map of which file owns
auth, billing, logging, etc. Read before adding helpers.

**Production-silent logging** — `@vybekiit/core` `createLogger`: verbose in development, quiet in
production automatically via `NODE_ENV`; optional `LOG_LEVEL` override for agents only.

## CLI & commands

**Doctor** — the maintained CLI subcommand that installs and verifies the toolchain (OS-aware,
idempotent) and diagnoses a broken project. The human-facing doctor *skill* wraps it for the buyer.

**Setup** (CLI) — the post-purchase welcome command: brand banner then toolchain provisioning via
doctor. Distinct from the doctor *skill* and the **setup-payments** skill.
_Avoid_: conflating with `plan-setup` (domain checklist JSON) or buyer goal "set up my app".

**Brand motto** — *Ship SaaS and projects like a software engineer — without becoming one.* — shown
on the CLI welcome banner. The landing **tagline** (*The SaaS kit that ships itself.*) stays separate
marketing copy.

**Agentic toolchain** — the CLIs the agent must have to act (supabase, wrangler, Expo/EAS, etc.),
provisioned globally by `vybekiit doctor` so the buyer never configures tooling. Nothing is wired
before the template or adapter that drives it is selected.

**Feature readiness** — a planner (`planFeatureReadiness`) that detects missing cross-template
dependencies and returns orchestration steps instead of blocking the builder with "you need a website
first."

**Orchestration step** — a single agent action (scaffold backend, run a skill, set a secret setting)
the agent executes without asking the builder to choose between technical options.

**Project surface inference** — the single CLI rule set that answers "which template is this cwd?"
(web, mobile, extension, spa, backend) and whether mobile/extension toolchain flags apply. Used by
doctor, platform-skills, and agent-layer commands — one module, not parallel heuristics.
_Avoid_: duplicating `isMobileProject` / `detectTemplateName` logic in new call sites.

**Backend template** — Express MVC API server for mobile and extension clients — distinct from the
Next.js web template. Buyers scaffold it with `vybekiit scaffold backend` when a phone app or
extension needs sign-in, payments, or data without a full marketing website.

## Distribution & release

**The gate** — the private-repo GitHub invite that grants paid access after Lemon Squeezy checkout
collects the buyer's username. Refund → access removed. The buyer is never invited to the maintainer
monorepo.

**Template mirror** — a private per-template org repo the CLI clones to deliver a template — a
derived, force-pushed copy of the template folder, never hand-edited (ADR-0005).

**Mirror sync** — maintainer pre-push hook that force-pushes all delivery mirrors after the local
quality gate; GitHub Actions `workflow_dispatch` is the manual fallback. The monorepo is the single
source of truth.

**Kit release** — a unified `vX.Y.Z` tag cut on the monorepo and stamped on every delivery mirror
after sync. Maintainer-facing release line — not shown to buyers. See ADR-0013.
_Avoid_: exposing git tags to vibe coders (they track npm semver via `update-kit`).

**Release line** — the ordered sequence of kit releases on `VybeKiit/vybekiit` GitHub Releases — the
canonical changelog for features, fixes, and implementations.
_Avoid_: duplicate Release pages on mirror repos (mirrors get git tags only).

**npm semver** — per-package version on `@vybekiit/*` — what buyers' `update-kit` compares via
`planKitUpdate()`. Bumped in lockstep with kit releases; may diverge on breaking adapter changes.

**Tracer bullet** — the v1.0 thin end-to-end slice through every layer that proves the whole machine:
a stranger pays, gets invited, scaffolds a web app, wires payments, deploys live.

## Data, providers & the wire

**DB preset** — a composable SaaS table bundle (schema + indexes + RLS) for one kit feature — e.g.
`orders`, `organizations`. Applied via `vybekiit apply-preset`; verified by doctor and goal skills.
Agent-only term; buyer hears "setting up your app's data for [feature]."
_Avoid_: migration, DDL, or preset jargon in buyer speech.

**Feature module** — synonym for a single DB preset entry in the catalog: one feature, one manifest,
one apply command.
_Avoid_: conflating with npm packages (packages consume feature modules).

**Preset manifest** — the JSON SSOT for a feature module: entities, relations, indexes with `reason`,
RLS mode, capabilities. Lives at `packages/db/presets/<feature>/preset.manifest.json`. Agent-only.

**Capability flag** — a boolean on `DataProvider.capabilities` declaring optional ops (`upsert`,
`fullTextSearch`, etc.). Callers check before using extended methods. Agent-only.

**Client cache** — what the app remembers from the server while browsing — TanStack Query via
`@vybekiit/client-state` (never say the name to the builder).

**Browser automation** — agent-only Playwright CLI for dashboards without API/MCP
(`@vybekiit/browser-automation`). Never say to the builder.

**Fresh-squeezy** — agent codename for the Lemon Squeezy `ls` target inside browser-automation.

**Registrar credential setup** — agent-only browser step to mint Namecheap or GoDaddy API keys
(`vybekiit-automate nc|gd setup`) when OAuth is unavailable. Distinct from **Nameserver delegation**,
which uses `@vybekiit/deploy` REST after keys exist.
_Avoid_: conflating with domain purchase — the builder still registers and pays at the registrar
manually in v1.

**Nameserver delegation** — pointing registrar nameserver records at Cloudflare (or another host).
Automated via `@vybekiit/deploy` when registrar API env vars are set — not via browser automation.

**Payment MCP tier** — Stripe and PayPal via hosted MCP; Lemon Squeezy via browser-automation CLI.

**MCP merge snippet** — provider JSON under buyer `.vybekiit/agent/mcp-*.json` merged into Cursor,
Claude Desktop, or Codex config — see `mcp-setup.md` in web template.

**MCP tier (data)** — Supabase, Neon, Firebase — login-once agent tooling for database onboarding.

**Neon branching (dev)** — Neon MCP/CLI feature for safe schema experiments on disposable branches —
dev/IDE only, never production.

**Firebase agent skills** — official `firebase/agent-skills` packages teaching agents Firebase CLI +
MCP workflows alongside `@vybekiit/db` Firestore adapter.

**MongoDB (agent path)** — opt-in data store when `DATA_PROVIDER=mongodb`. Official MCP and pinned
agent-skills support maintainers and agents only — not a buyer-facing data tier.
_Avoid_: offering Mongo as a default or buyer-facing choice alongside Supabase, Neon, or Firebase.

**JSON client** — `@vybekiit/core/http` (via `@vybekiit/core`) — typed fetch helpers that preserve
semantic HTTP outcome codes. Templates keep a thin origin seam (same-origin web vs absolute URL on
mobile/spa).

**HTTP outcome** — stable semantic code on API error responses (`bad_input`, `unauthorized`,
`forbidden`, …) paired with a plain `error` message. Agents branch on `code`; vibe coders see only
the message. Shipped by `@vybekiit/core/http`; agent-internal on the wire.
_Avoid_: saying status codes or outcome names to the vibe coder.

**Message catalog loader** — shared locale + RTL, in `templates/*` owned code. Browser templates
import the locale rules for RTL + default locale; Node servers resolve the i18n provider.

## Product features & stacks

**Web stack** — the default buyer path: the **web** template serves API + UI on one origin (`:3000`).
**Mobile** and **extension** clients call the web backend for auth, billing, and data. Practice auth +
checkout work with blank secrets.
_Avoid_: telling the builder to run a separate API server unless they chose the SPA stack.

**SPA stack** — alternate buyer path: **spa** (Vite admin UI, `:5173`) always pairs with **backend**
(Express API, `:4000`). SPA never calls the web template; auth + billing wire through `@vybekiit/auth`
and `@vybekiit/payments` on the backend. Practice checkout completes on SPA `/checkout/practice`.
_Avoid_: conflating SPA stack with web stack — they are separate scaffolds.

**Maintained package reuse** — every template imports SaaS logic from `@vybekiit/*` packages — auth,
payments, core/http, db, etc. Template-owned files are thin wire points (`auth-client.ts`,
`billing-client.ts`) the agent skills touch once. No duplicated provider logic in templates.
_Avoid_: custom fetch/auth code that bypasses the packages.

**SEO** — discoverability metadata (titles, descriptions, sitemaps, Open Graph) so search engines
find the buyer's app. Owned template code + buyer skills; agent-handled. In buyer voice: "how search
engines find you".
_Avoid_: saying "SEO" to the builder.

**GEO / answer-engine optimization** — structured metadata so AI answer engines (ChatGPT, Perplexity,
Claude, Google AI Mode) can discover and cite the buyer's app — JSON-LD, `/llms.txt`, Open Graph, and
hub-spoke internal links. Owned template code + buyer skills (`add-blog`, `go-live`).
_Avoid_: exposing "GEO" or "AEO" jargon — say "so AI search can find your site".

**Background job** — work the app runs later or on a schedule (cleanup, reminders); owned template
code, Cloudflare Cron/Queues default. Buyer skill: go-live checks bindings.

**Visitor stats** — plain-language analytics; owned template code, Plausible default. Buyer skill:
`add-analytics`.

**Push notification** — alert on phone; owned template code (Expo default). Buyer skill:
`add-notifications`.

**AI feature** — server-side smart replies or helpers; owned template code, OpenAI default. Buyer
skill: `add-ai` (not pre-built demo apps).

**Search index** — find-in-app data; owned template code, Supabase default. Buyer skill: `add-search`.

**Live update** — real-time channels; owned template code (Supabase default).

**Blog page** — content from repo files; owned template code (MDX + SEO). Buyer skill: `add-blog`.

**Cookie consent** — banner + export hooks; owned template code.

**Team workspace** — orgs and invites; owned template code (better-auth + db). Buyer skill:
`add-teams`.

**Fast storage** — KV cache; owned template code (Cloudflare default). **Agent-only / harden** — not
a buyer onboarding path. Redis is not a VybeKiit buyer path; use TanStack Query for client cache
(ADR-0014).

**Asset delivery** — the kit's automatic optimize + CDN layer, owned template code. The builder never
picks a CDN; it follows hosting + storage settings (ADR-0010).

**Project asset** — a file in the repo the builder ships with the app (`public/`, `assets/`,
extension icons) — optimized automatically at build time.

**User upload** — a file a user adds at runtime (avatar, attachment) — stored via `StorageProvider`
and served through CDN transform URLs, not raw bucket links.

**Agent-kit** — the private tooling package holding the shared agent-layer source: skill contract,
`language.md` vocabulary tables, goal-index format, update-kit logic. Bundled into the published CLI
via tsup; template-specific skills stay embedded per template.

## UI catalog

**UI source catalog** — agent-only list of approved shadcn-compatible block libraries (BundUI, Magic
UI, Kokonut, Aceternity, Untitled, Gluestack, AI Elements, Kibo UI, 21st.dev, …) in
`.vybekiit/agent/ui-sources.md`. The builder never picks; the agent normalizes every import.

**AI Elements namespace** — mirrored Vercel AI Elements blocks under `src/components/ai-elements/` —
chat, agent, streaming, tool-call UI built for the AI SDK. Includes core components and `example-*`
demo compositions.

**Kibo namespace** — mirrored Kibo UI blocks under `src/components/kibo/` — application-grade
components (kanban, editor, gantt, etc.) from the shadcnblocks registry.

**Component library app** — public browsable gallery at `ui.vybekiit.com` (`apps/componentLibrary`) —
catalog of mirrored blocks with Primary Previews and a separate Examples tab; maintainer monorepo
app, not shipped to buyers.

**Primary preview** — live render on a component detail page via a demo wrapper
(`apps/componentLibrary/src/demos/{namespace}/{name}.tsx`) — required for component entries to show a
live preview.

**Example entry** — upstream demo synced as its own catalog item (`kind: example`) — browsable on the
global Examples tab, separate from the component's Primary Preview.

**UI namespace** — per-source folder under `src/components/` (`bundui/`, `magicui/`, …) holding
mirrored upstream components — not merged into kit `ui/`.

**UI catalog index** — machine-readable manifest (`.vybekiit/agent/ui-catalog-index.json`) agents and
the VybeKiit UI catalog MCP search against.

**Registry sync** — maintainer script (`pnpm sync:ui`) that refreshes mirrored components from
upstream registries; lock file at `scripts/ui-registry-lock.json`.

**SaaS showcase bundle** — curated subset of mirrored UI blocks (`scripts/saas-showcase-manifest.json`)
rendered on the landing hero carousel — representative, not exhaustive.

**Component preview card** — landing hero frame showing source badge + block name for one mirrored
component; live mount only when `renderMode: live`.

**Platform MCP bundle** — per-provider MCP configs under `.vybekiit/agent/` (`mcp-ui-catalog.json`,
`mcp-neon.json`, `mcp-firebase.json`) merged into buyer `.cursor/mcp.json`.

**Normalize-on-import** — when copying a third-party UI block, swap to kit `Button`/`Input`, map
colors to design tokens, and strip custom sizes before shipping.

**Primitive-first** — use `src/components/ui/*` for standard controls — never raw `<button>` /
one-off styled inputs.

**Brand mark** — the small official logo beside a builder-tool or product-stack name on the landing
page — full-color at rest on the dark row, not a hand-drawn stand-in.
_Avoid_: placeholder icons, monochrome fake paths, or calling Codex a different mark than OpenAI.

## Report Mode & landing UX

**Report Mode** — dev-only overlay on the localhost preview (web, mobile, extension). The builder
toggles inspect mode (Option+Shift+R on web/extension; **R** FAB on mobile), clicks what looks wrong,
types a one-line note, and the kit fires a native assistant deeplink with structured context. Never
ships in production. In buyer voice: **Point & fix** — never "Report Mode" unless they ask about the
hotkey.
_Avoid_: exposing deeplinks, URI schemes, or DOM selectors to the builder.

**Vibe coder report** — the structured handoff payload (route, element selector or tap coordinates,
console errors, builder note) prefixed with `[VybeKiit Report]`. Agent-internal; `doctor` reads it and
skips the reproduce question.
_Avoid_: asking the builder to craft a prompt when Report Mode already captured context.

**Hold confirm** — hover a dock menu option for ~2 seconds until a rounded border fills; the choice
then locks in (position, chat target). Plain-language only.
_Avoid_: requiring a click when the UI is designed for hover-and-hold.

**Report walkthrough** — first-visit guided tour of the localhost feedback bar. Skippable; celebrates
completion.
_Avoid_: calling it onboarding or a tutorial in buyer-facing copy.

**Control hint** — short plain-language tooltip after ~half a second hover on a dock control. Explains
what it does and what to do next.
_Avoid_: jargon (deeplink, selector, handoff target).

**Spot label** — after the builder clicks what looks wrong, the plain-language name for what they
pointed at — starting from that element and its immediate text, not unrelated headings elsewhere.
_Avoid_: DOM, selector, shortest text node anywhere on the page.

**Inspect highlight** — the colored ring around the element the builder is pointing at during pick
mode. Builders can change its color from the dock; the pick-mode banner stays fixed.
_Avoid_: calling it hover color or tinting the banner when you mean the ring only.

**Builder tools** — assistants and dev tools the vibe coder already uses (Cursor, Claude Code, Codex,
GitHub, Figma, TypeScript, Node.js, Playwright). Shown in the hero orbit only.
_Avoid_: mixing product adapters (Cloudflare, Lemon Squeezy, Supabase) into the hero orbit.

**Product stack** — services and frameworks the shipped app runs on (Next.js, Supabase, Cloudflare,
Lemon Squeezy, shadcn/ui, etc.). Shown in the pricing tech row only.
_Avoid_: calling both lists "tech stack" or duplicating builder tools in the product row.

**Vibe hint** — plain-English, cheeky explanation on a landing-page brand mark: what the tool/service
is plus reassurance the vibe coder never touches it. Desktop: hover tooltip. Mobile (product-stack row
only): always-visible subtitle.
_Avoid_: control hint (Report Mode dock only), jargon definitions, or duplicating the technical label.

**Domino cascade** — one-time on-mount intro on the hero builder-tool orbit (desktop only): each vibe
hint tooltip auto-opens in sequence (~1.2s apart), then closes; hover works anytime after.
_Avoid_: calling it a tutorial or onboarding; it is ambient store-page personality.

**Proceed animation** — when the builder clicks Get VybeKiit, a cart icon flies toward the checkout
direction as visual feedback before navigation — RTL-aware on the landing page.
_Avoid_: static lock icon with no motion feedback.

**Reading-speed reveal** — store homepage copy that appears character-by-character at natural reading
pace when a section enters view; runs once per page load.
_Avoid_: instant fade-in for marketing headlines and body copy on the store homepage.

**Rolling stat** — a numeric value on the store homepage that animates from zero to its displayed
value when visible (e.g. price, dashboard mockup figures).

**Auto-scroll row** — a horizontal row of items that moves continuously on its own and loops (e.g.
tech logos, product demo cards). Builders customize content inside the row, not the motion.
_Avoid_: saying "marquee" or "carousel" when you mean this always-on horizontal loop.

## Localization

**Message catalog** — JSON file of keys → strings; sole source of user-facing copy.

**Locale** — language tag (e.g. `en`, `he`); drives both translations and RTL layout.

**Default locale** — `en` shipped in every template; other locales added via the `add-language` buyer
skill.

**Auto-localized** — agents add locales by duplicating the catalog and filling translations in one
shot (not by writing copy inline in components).

## Supported tools

**Supported agent tools** — Claude Code, Codex, Cursor. Each loads the same buyer `AGENTS.md` via a
thin redirect; Copilot is out of scope.
