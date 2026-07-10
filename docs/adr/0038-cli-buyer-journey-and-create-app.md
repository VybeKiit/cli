# ADR-0038: CLI buyer journey, `create app`, kit workspace, and in-app add/update surface

## Status

Accepted — product contract for the buyer-facing CLI journey **and** the ongoing
install/copy/update surface after create.

Extends [ADR-0036](./0036-cli-command-surface-and-dual-mode.md) (dual-mode registry) and
[ADR-0033](./0033-cli-single-published-artifact-and-access-gate.md) (CLI-only public artifact +
access gate). Amends the **scaffold delivery** follow-up in ADR-0033 and the “copy a single
template clean” posture of [ADR-0005](./0005-template-distribution-mirrors.md) for the **create**
path: an app is never delivered alone. Doctor install inventory aligns with
[ADR-0001](./0001-agentic-cli-toolchain.md) and the declarations in
`cli/src/doctor/toolDeclarations.ts` + `cli/src/doctor/nativeToolchain.ts`.

## Context

The public `vybekiit` CLI is the only npm artifact and the front door after purchase. Today’s
surface mixes three incomplete first-run stories (`setup`, `new`, `drop`), documents a bare-TTY
menu that is not implemented, and scaffolds a **single template directory** into a fresh folder
where `workspace:*` cannot resolve. ADR-0033 already recorded that gap.

Beyond first create, the product also depends on **ready-made pieces** the agent (and CLI) copy
or apply into a live buyer workspace: DB feature presets, page recipes, backend API scaffolds,
and kit updates. Those must be first-class in the journey contract so they are not treated as
afterthoughts or orphan commands.

Setup / doctor must also deliver the **smoothest agent experience**: detect which agents are
present (global and per-project), install the matching skills, wire curated MCPs, validate that
template `public/` / assets go through CDN + cache + WebP (ADR-0010), and ship performance
improvement via the **web-perf-ci** skill (and surface-aware perf guidance) for web, mobile, and
extension.

Primary user: a paid vibe coder after Lemon Squeezy checkout and GitHub invite. Secondary user:
the coding agent driving the same verbs with flags / JSON (never hangs).

## Decision

### 1. End-to-end buyer journey (happy path)

```text
Purchase (landing / Lemon Squeezy)
    │  GitHub username → invite to gated delivery repos
    ▼
Install public CLI
    npx vybekiit          # TTY: main menu
    npx vybekiit setup    # first-run orchestrator (optional shortcut)
    │
    ├─ setup / doctor     EXEMPT from license gate
    │     FULL doctor pass (see §4 — every install + verify step)
    │     detect agents (global + per-project) → install skills for those agents (§4.10)
    │     wire curated MCPs for detected agents (§4.11)
    │     buyer signs in where needed (gh / wrangler / supabase / …)
    │
    ├─ GATE (every other command)
    │     gh present? → gh authed? → org member OR delivery-repo collaborator?
    │     fail → plain purchase / sign-in guidance; re-run re-checks
    │
    ├─ create app --web | --mobile | --extension
    │     kit workspace (packages + surface), never app-alone
    │     assets pipeline: public/ → optimize + CDN + cache + WebP (§8.1)
    │     perf skill + CI path available (web-perf-ci) for all surfaces (§8.2)
    │
    ├─ handoff to agent layer
    │     open folder → "Set up my app."
    │     onboarding / payments / go-live / …
    │     re-run doctor inside the project (surface-aware + project skills + MCP)
    │
    └─ ONGOING (same kit workspace, same dual-mode CLI)
          apply / verify DB presets
          install page recipes into the app
          add backend / routes / CRUD / upload
          update kit (packages + agent layer + platform skills)
          maximize performance (assets + web-perf-ci / Core Web Vitals)
          env wizard, plan-*, sync-agent-layer, …
```

Session #1 product promise (from CONTEXT): stranger pays → invited → tools ready → app workspace
created → agent walks setup → path to live. The CLI owns **tools + create + copy/apply/update
seams**; the agent layer owns plain-language product setup and Decide + Guide.

### 2. Bare invocation = dual-mode front door (implements ADR-0036)

| Invocation | Behavior |
|------------|----------|
| `vybekiit` in a TTY | `@clack/prompts` main menu (never a wall of agent verbs only) |
| `vybekiit` non-TTY | Short help; exit 0; **never hang** |
| `vybekiit --help` / `-h` | Buyer-tier help by default |
| `vybekiit help --all` (or menu “More…”) | Full verb list for agents / power users |
| `vybekiit --version` / `-v` | Version only |

**Main menu (buyer tier):**

1. **Set up my tools** → `setup` (banner + full doctor + honest next step)
2. **Create an app** → surface pick → `create app --<surface>`
3. **Check my tools** → full `doctor`
4. **More…** → add pieces (presets / recipes / backend), update kit, agent verbs, full help

Both menu and flags call the **same** handler functions (`COMMAND_HANDLERS` in
`cli/src/cliRunner.ts`).

### 3. `setup` is the first-run orchestrator

```text
vybekiit setup
  1. Welcome banner (brand + motto)
  2. runDoctor()                    # FULL doctor pass (§4), same core as `doctor`
       includes: agent detect → skills install (global + project)
                 MCP wire for supported agents
                 (post-create also: assets + perf checks when cwd is a kit)
  3. Probe access (checkAccess)     # report only; do not skip doctor if ungated
  4. Print ONE conditional next step (see matrix)
```

**Honest next-step matrix (never false “Ready”):**

| Doctor | Gate reason | Next step |
|--------|-------------|-----------|
| fail | any | The one fix from doctor output (e.g. install Homebrew, re-run setup) |
| pass | `gh-missing` | Install/sign-in path for `gh`, then re-run |
| pass | `gh-unauthed` | `gh auth login --web`, then re-run setup |
| pass | `no-access` | Purchase / wrong GitHub account (site URL + `gh auth status`) |
| pass | `ok` / `skipped` | Create app: `vybekiit create app --web` (or menu Create) |

`setup` does not scaffold and does not apply presets. It only makes the buyer **ready to create**.

### 4. `doctor` — full provision + verify inventory (gate-exempt)

Doctor is the **complete** agentic toolchain pass ([ADR-0001](./0001-agentic-cli-toolchain.md)).
It is **not** a partial “gh only” check. Selection is **provider- and surface-aware** (install
only what this project needs), but the **catalog** below is the full set the product knows how
to install/probe. Implementation SSOT:

- `cli/src/doctor/toolDeclarations.ts`
- `cli/src/doctor/nativeToolchain.ts`
- `cli/src/doctor/toolchain.ts` (`selectToolchain`, `mergeAgentAndProviderTools`)
- `cli/src/doctor/run.ts` (executor + verify pipeline)

#### 4.1 Always considered (agent runtime layer)

Merged in **before** provider tools. Cursor sessions skip needing a separate agent binary.

| Tool | Purpose | Typical install | Auth probe |
|------|---------|-----------------|------------|
| `claude` | Claude Code assistant | `npm i -g @anthropic-ai/claude-code` | — |
| `codex` | OpenAI Codex assistant | `npm i -g @openai/codex` | — |
| `skills` | Official platform skills installer ([skills.sh](https://skills.sh)) | `npm i -g skills` | — |

#### 4.2 Always for cloud path (base)

| Tool | Purpose | Typical install | Auth probe |
|------|---------|-----------------|------------|
| `gh` | Download gated kit / GitHub identity for the license gate | brew/scoop `gh` | `gh auth status` → `gh auth login --web` |

#### 4.3 Hosting CLI (from `HOSTING_PROVIDER`, default Cloudflare)

| Tool | When | Typical install | Auth probe |
|------|------|-----------------|------------|
| `wrangler` | `HOSTING_PROVIDER=cloudflare` (default) | `npm i -g wrangler` | `wrangler whoami` → `wrangler login` |
| `vercel` | `HOSTING_PROVIDER=vercel` | `npm i -g vercel` | `vercel whoami` → `vercel login` |
| `railway` | `HOSTING_PROVIDER=railway`, or Railway stack active as coupled DB host | `npm i -g @railway/cli` | `railway whoami` → `railway login` |
| `aws` | `HOSTING_PROVIDER=aws` (or auxiliary AWS providers — see 4.5) | brew/scoop AWS CLI | `aws sts get-caller-identity` → `aws configure` |

#### 4.4 Data / database CLI (from `DATA_PROVIDER`, default Supabase)

| Tool | When | Typical install | Auth probe |
|------|------|-----------------|------------|
| `supabase` | `DATA_PROVIDER=supabase` (default) | brew/scoop Supabase CLI | `supabase projects list` → `supabase login` |
| `neonctl` | `DATA_PROVIDER=neon` | `npm i -g neonctl` | `neonctl me` → `neonctl auth` |
| `atlas` | `DATA_PROVIDER=mongodb` | brew/scoop MongoDB Atlas CLI | `atlas auth whoami` → `atlas auth login` |
| *(none extra)* | `firebase` / `local` / some Railway-only data paths | SDK/env-driven; no extra CLI in this table | — |

#### 4.5 Conditional extras

| Tool | When | Typical install | Auth probe |
|------|------|-----------------|------------|
| `aws` | Any auxiliary AWS-backed provider (data/storage/email/etc. via `needsAwsCliFromAuxiliaryProviders`) | brew/scoop AWS CLI | as above |
| `gcloud` | Google sign-in path (`GOOGLE_OAUTH_CLIENT_ID` or wantsGoogleAuth) | brew cask / scoop `gcloud` | `gcloud auth list` → `gcloud auth login` |
| `eas` | Mobile surface | `npm i -g eas-cli` | `eas whoami` → `eas login` |
| `launch` | Mobile surface (store publish via `launch-store`) | `npm i -g launch-store` | — |

#### 4.6 Native OS tools (surface + platform)

| Tool | When | Typical install | Notes |
|------|------|-----------------|-------|
| `watchman` | Mobile surface | brew/scoop | Fast Metro file watching |
| `pod` (CocoaPods) | Mobile surface **on macOS** | brew `cocoapods` | iOS native libs after `ios/` exists |
| `docker` | Backend surface | brew cask / scoop / brew | Local services in containers; probe `docker info` |

#### 4.7 Full doctor run pipeline (every pass, not optional “partial mode”)

A full `vybekiit doctor` / `setup` doctor call always runs this pipeline (steps no-op or skip
cleanly when irrelevant to cwd/env):

1. **OS family check** — darwin / win32 / linux only  
2. **Infer project surface** from cwd (`web` / `spa` / `mobile` / `extension` / `backend`)  
3. **Merge env** — `process.env` + project `.env`  
4. **Detect agents** — global (PATH / home configs / env) **and** per-project (cwd agent
   configs, Cursor session, etc.); see §4.10  
5. **Select + install missing tools** — agent tools ∪ provider tools ∪ native tools; OS-aware
   install commands; `stdio: inherit` for real installs  
6. **Report each tool** — installed / missing requirement / auth status + login hint  
7. **Install / refresh skills for detected agents** — global where the agent discovers globally;
   project-local under the kit (`.agents/skills`, agent symlinks, platform pins); see §4.10  
8. **Wire curated MCPs** for agents that support MCP — core + surface/provider subset; see §4.11  
9. **Native project setup** — surface-specific local project wiring  
10. **Mobile publish readiness** — when mobile (Xcode/toolchain-style checks)  
11. **External service verifies (parallel)**  
    - DB **presets** presence (`verifyPresetsDoctor`)  
    - Namecheap registrar probe when configured  
    - GoDaddy registrar probe when configured  
    - Email worker probe when configured  
12. **Railway stack report + agent setup** when Railway stack active  
13. **Platform skills verify** — pinned skills under `.agents/skills/` (+ lock) present  
14. **Project health** — template/workspace health checks  
15. **Asset delivery validate** (when kit/project present) — `public/` / project assets on the
    hybrid optimize + CDN + cache + WebP path ([ADR-0010](./0010-hybrid-asset-optimization-cdn.md));
    see §8.1  
16. **Perf readiness hints** — web-perf-ci skill / budgets available for the surface; see §8.2  
17. **R2 storage provision** when Cloudflare storage path needs it  
18. **Product-surface hints** — jobs / KV / analytics / AI / notifications env gaps  
19. **Codex skills discovery** — enable `[features] skills = true` in `~/.codex/config.toml` when Codex installed  
20. **Report Mode assistant** — write inferred assistant into env keys for the surface  
21. **Exit code** — non-zero unless cloud tools installed, R2 ok (when applicable), agent ready
    (or Cursor), skills CLI ready, project health ok, mobile publish ok (when mobile); skills/MCP
    gaps for the *primary* detected agent should fail or clearly block with one fix (implementation
    may warn-first for optional MCPs)

#### 4.8 Single-tool path (agents only)

```text
vybekiit doctor --ensure <tool> [--json]
```

Installs/verifies **one** named tool from the catalog (e.g. `wrangler`, `supabase`). This is
an agent preflight optimization, **not** a substitute for the full doctor pass on first run.

#### 4.9 Selection rule (full catalog, sparse install)

- Doctor **knows** the entire catalog above.  
- Doctor **installs** only tools selected for this cwd + env + surface.  
- Pre-`create app` (empty cwd): safe defaults = agent tools + `gh` + default hosting (`wrangler`)
  + default data (`supabase`) + **global** agent skills + **core** MCPs for detected agents.  
- Post-`create app`: re-run doctor inside the workspace for the full surface-aware set
  (mobile adds `eas`/`launch`/watchman/CocoaPods; provider switches add neon/atlas/vercel/…;
  **project** skills + surface MCPs + assets/perf checks).  
- **Never** document doctor as “just gh” or a partial subset in buyer/agent contracts.

#### 4.10 Agent detection → skills install (global + per-project)

**Goal:** The vibe coder’s actual assistant(s) already have the skills they need — no manual
“install skills” scavenger hunt.

**Detect (union of signals):**

| Scope | Signals (non-exhaustive) |
|-------|---------------------------|
| **Global** | Agent CLIs on PATH (`claude`, `codex`, …); home configs (`~/.claude`, `~/.codex`, Cursor user dir); env markers (`CLAUDE_CODE`, `CURSOR_*`, `CODEX_CLI`, …); `cli/src/lib/agentDetection.ts` family |
| **Per-project** | Cwd / kit: `.cursor/`, `.claude/`, `AGENTS.md`, `.agents/skills/`, `platform-skills.manifest.json`, `skills-lock.json`; Cursor session env when doctor runs inside the IDE |

Detect **all present** agents, not only one primary. Primary (session/env) drives Report Mode and
MCP priority; secondary agents still get skill discovery enabled where cheap and safe.

**Install / enable (by agent):**

| Agent | Skills actions |
|-------|----------------|
| Claude Code | Ensure buyer + platform skills discoverable via `.claude/skills` → `.agents/skills` (and hooks/settings as shipped); `skills` CLI for pinned upstreams when lock/manifest present |
| Cursor | Ensure `.cursor/skills` → `.agents/skills` (and rules redirect); project MCP config when supported |
| Codex | `skills` CLI pins when needed; enable Agent Skills in `~/.codex/config.toml` (`[features] skills = true`) — already partially implemented |
| Other / future | Same dual-mode pattern: project stubs under official discovery paths; global only when the agent has a global skills root |

**What gets installed:**

1. **`skills` CLI** (already in agent tool catalog) when missing.  
2. **Platform skills** from the surface manifest / `skills-lock.json` into `.agents/skills/`
   (project). Pre-create (no project): pin a **minimal global kit skill pack** only if the agent
   supports a global skills directory; otherwise defer project pins until after `create app`.  
3. **Buyer goal skill stubs** — via `render-agent-layer` / template ship when project exists.  
4. **Performance skill** — ensure **web-perf-ci** (or the kit’s shipped wrapper that points at it)
   is available for web, mobile, and extension so the agent can wire Core Web Vitals gates; see §8.2.  
5. **Idempotent** — re-run doctor does not duplicate or clobber buyer-owned skill extensions.

Buyer speech: never “symlink” or “skills.sh”; agent says “I’m setting up the helpers your coding
tool needs.”

#### 4.11 MCP wiring (smoothest vibe-coder experience)

**Goal:** Agents that support MCP get a **curated, sparse** set of servers so the assistant can
use docs, GitHub, DB, deploy, and browser tools without the buyer pasting JSON by hand.

**SSOT today:** template catalogs such as `templates/web/.claude/mcp/mcp-servers.json` (core +
category priorities). Doctor / setup **reads the catalog** and wires **by agent + surface +
provider**, not “install every server.”

| Priority band | Examples (from catalog) | When |
|---------------|-------------------------|------|
| **Core (always for MCP-capable agents)** | context7 (versioned library docs), github | Every setup |
| **Surface / provider** | playwright (frontend), supabase (default data), cloudflare / vercel (hosting) | Matching surface or `*_PROVIDER` |
| **Opt-in / later** | figma, sentry, stripe, resend, research MCPs, … | Buyer goal or provider already in use; never bulk-install on day one |

**Per agent:**

| Agent | MCP action |
|-------|------------|
| Claude Code | Register core (+ selected) servers via `claude mcp add` / project MCP config as appropriate |
| Cursor | Write/merge `.cursor/mcp.json` (or current Cursor MCP schema) for the same curated set |
| Codex / Gemini (if `mcpSupported: false` today) | Skip auto-wire; document agent-only fallback (`doc-fallback`); upgrade when the product gains MCP support in `agentDetection` |

**Rules:**

1. Prefer **project-scoped** MCP config inside the kit when possible (least surprise across machines).  
2. Global MCP only when the agent has no project scope and the server is core.  
3. Secrets stay env/login — doctor never commits tokens; missing env → one plain “sign in / paste
   key” handoff (Decide + Guide).  
4. Failure of an **optional** MCP is a warning + `doc-fallback` path; failure of **core** MCP
   install for the primary agent is a clear next step, not a silent skip.  
5. Buyer never hears “MCP”; language.md: “a tool I can use for you.”

Related: `vybekiit add bridge` remains an advanced path for browser-bridge MCP, not first-run
required.

### 5. Access gate (unchanged policy, clearer place in the journey)

Every command **except** `help` / `version` / `doctor` runs `ensureAccessOrExit()` before the
handler. Failures are plain language only (no stack traces). `VYBEKIIT_SKIP_GATE=1` remains for
CI/automation.

### 6. Create command grammar — app is never alone

**Primary buyer verb:**

```text
vybekiit create app --web [directory]
vybekiit create app --mobile [directory]
vybekiit create app --extension [directory]
```

Rules:

1. **Surface flags only** for buyer create: `--web`, `--mobile`, `--extension`. Not positional
   template names (`new web`), not free-form ids.
2. **Exactly one surface flag in v1.** Missing flag (non-TTY) → clear error and usage. TTY
   without flag → prompt for surface, then same handler. Two+ flags → “Pick one surface for now.”
3. **Directory optional.** Default when omitted: `./<surface>` (e.g. `./web`).
4. **App cannot be alone.** `create app` always delivers a **kit workspace**:
   - private maintained `packages/*` (so `workspace:*` resolves locally), and  
   - the chosen app surface payload, and  
   - catalogs the agent needs later (DB presets in `@vybekiit/db`, page recipe sources /
     install metadata, agent layer),  
   - under one installable workspace root.
5. **No public `@vybekiit/*` rewrite as the install story.** Do not pin `workspace:*` to `*` or
   `^x.y.z` on public npm (ADR-0033). Delivery is gated kit source.
6. **Success output:** celebrate + **one** next action (open folder / tell agent
   “Set up my app.”). Errors print a single plain-language line.
7. **Cancel / non-TTY:** dual-mode — prompts only when `isInteractive()`; flags never hang.

**Not buyer `create app` surfaces in v1:** `spa` as a flag. **Backend** is not a top-level
`create app --backend`; it is an **in-workspace add** (§7.3) so mobile/extension/spa can pair
with an API without pretending backend is a standalone first purchase surface.

### 7. After create — ready pieces: copy, apply, add, update

The journey does **not** end at scaffold. The kit workspace + CLI must support **ready-made**
capabilities the agent installs into the buyer app. Buyer speech stays plain language
([LANGUAGE.md](../../LANGUAGE.md)); CLI/agent verbs below are the implementation surface.

#### 7.1 Database feature presets (ready data shapes)

**What:** Composable SaaS table bundles (schema + indexes + RLS / NoSQL equivalents) for one
feature — e.g. `orders`, `organizations`, commerce/CRM/content packs (`products`, `cart`,
`coupons`, `customers`, `pipeline`, `support_tickets`, `tasks`, `blog_posts`,
`calendar_events`). SSOT: `packages/db/presets/<feature>/` + manifests
([ADR-0020](./0020-relational-db-feature-presets.md)).

**CLI (agent-driven; JSON-friendly):**

```text
vybekiit list-presets
vybekiit apply-preset <feature> [--provider=supabase|neon|railway|mongodb|firebase|aws] [--dry-run]
vybekiit verify-presets [--fix] [preset...]
```

**Doctor link:** full doctor runs `verifyPresetsDoctor` when env allows; agent translates
“setting up your app's data for [feature].”

**Contract:** Presets live in the **kit** (`packages/db`), not invented in the buyer app.
Apply/verify always target the buyer’s configured DB (`DATABASE_URL` / provider SDKs).

#### 7.2 Page recipes (ready screens → copy into the app)

**What:** Catalog of ready page outcomes (auth, payments, teams, search, AI, blog, …) with
routes, install notes, linked feature modules / skills. Runnable sources under
`apps/componentLibrary/src/pageRecipes/*`; manifest
`scripts/data/page-recipe-manifest.json` ([LANGUAGE.md](../../LANGUAGE.md) Page recipe catalog).

**Contract:**

1. Recipes are **not** all dumped into the app at `create app` time.  
2. The vibe coder asks (or picks); the **agent installs** a recipe into the owned surface
   (copy/adapt source, wire routes, honor `TODO:` integration markers and install notes).  
3. The kit workspace from `create app` must **include access** to recipe sources + manifest
   (or a delivered catalog slice) so install works offline from the gated kit — not only from
   the maintainer monorepo.  
4. CLI may grow an explicit verb later (e.g. `vybekiit add page-recipe <id>`); until then the
   agent uses kit paths + skills. Either way, **installability of recipes is part of delivery**,
   not a gallery-only feature.  
5. Coverage gate remains `pnpm check:page-recipes` on the maintainer side.

#### 7.3 Backends and API pieces (ready server surface)

**What:** Express MVC backend and incremental API pieces for clients that need a server
(mobile / extension / spa pairing).

**CLI:**

```text
vybekiit scaffold backend [directory]    # add backend/ into (or beside) the kit workspace
vybekiit backend add-route <name>
vybekiit backend add-crud <resource>
vybekiit backend add-upload
```

**Contract:** Backend is an **add-on inside the kit workspace**, not `create app --backend` in
v1. Scaffold pulls from the same gated kit source rules as create (packages resolve; no orphan
copy). Docker is part of doctor’s native set when backend surface is detected.

#### 7.4 Databases as product steps (not only CLIs)

Doctor installs **CLIs**; agents **create/configure DBs** after login:

- Default: programmatic Supabase project create → keys into `.env` → schema / presets  
- Opt-in: Neon / MongoDB Atlas / Railway / Firebase / AWS per provider adapters  
- Presets (§7.1) apply **after** a live connection exists  
- Buyer never pastes raw stack traces; agent uses doctor + preset verify output  

#### 7.5 Kit update (ongoing)

Buyer says “update the kit.” Implementation channels (agent collapses to one plain sentence):

| Channel | Mechanism | Buyer hears |
|---------|-----------|-------------|
| Kit packages / workspace | Pull gated delivery / kit line (replaces public npm spine bumps under ADR-0033) | “latest improvements” |
| Agent layer | `vybekiit sync-agent-layer` (+ `render-agent-layer` when needed) | “refreshing my instructions” |
| Platform skills | `npx skills update -y` when `skills-lock.json` exists | same sentence — never name Expo/Vercel |

Optional related checks: `check-goals`, `check-agent-layer`, `plan-readiness`, `plan-setup`,
`plan-data-model`, `doc-fallback`, `dedup`, `env wizard`.

**Contract:** Updates assume a **kit workspace** from `create app`, not an orphan template folder.
Track 2 delivery must make channel 1 real (mirror/kit pull). Do not leave CONTEXT “npm bump
`@vybekiit/*`” as the only story when packages are private.

#### 7.6 Lifecycle diagram (after create)

```text
create app --web|--mobile|--extension
        │
        ▼
  kit workspace (packages + surface + catalogs + assets pipeline + perf skill)
        │
        ├─ doctor (full, surface-aware)
        │    agents → skills (global + project)
        │    MCP core + surface/provider
        │    assets validate · perf readiness
        ├─ env wizard / agent onboarding
        │
        ├─ apply-preset / verify-presets     ── ready DB shapes
        ├─ install page recipe(s)           ── ready screens into OWNED app
        ├─ scaffold backend + backend add-* ── ready API
        ├─ provider logins (from doctor hints)
        ├─ add-images / build optimize      ── WebP + CDN + cache (ADR-0010)
        ├─ web-perf-ci / go-live perf       ── Core Web Vitals gates
        │
        └─ update-kit (packages + agent layer + skills)
```

### 8. Delivery model for `create app` (Track 2 — required for truth)

`create app` must not copy only `templates/<surface>` into an empty external directory.

Conceptual layout (exact on-disk names are an implementation detail; the contract is not):

```text
<destination>/                     # kit workspace root
  packages/                        # MAINTAINED — workspace:* + db presets + assets
  <surface>/ or apps/<surface>     # OWNED app the buyer customizes
    public/  (or platform asset dirs)  # generic assets → optimize path (§8.1)
  # recipe catalog access          # page recipes installable from this kit
  # agent skills + MCP catalog     # discovery + curated servers
  package.json / pnpm-workspace
  agent layer files
```

Source resolution order:

1. `VYBEKIIT_TEMPLATES_DIR` / kit override for dev and CI  
2. Monorepo-local kit when developing inside this repo  
3. Else clone gated delivery source via `gh` (buyer path)

Mirror/invite topology may evolve, but **gate + invite must grant whatever `create app` clones**,
and the clone must be enough to: install workspace deps, apply presets, install page recipes, add
backend, run update-kit channels, optimize assets, and run perf CI — without the maintainer monorepo.

**update-kit / `.git`:** one documented mechanism in the implementing PR (mirror pull vs
re-overlay). CONTEXT, ADR-0005, and code must agree. Buyers never manage git tags.

#### 8.1 Template `public/` / assets — automatic CDN + cache + WebP

**Contract (must validate, not optional polish):** Generic project assets that ship with the
template (logos, heroes, icons under `public/`, surface asset dirs, and paths used by
`add-images`) go through the hybrid asset pipeline in
[ADR-0010](./0010-hybrid-asset-optimization-cdn.md):

| Concern | Requirement |
|---------|-------------|
| **Build-time optimize** | Repo assets run through `optimizeForBuild()` (sharp + SVGO at perceptual defaults) on build/prebuild — WebP (and safe fallbacks), compressed, no raw multi‑MB PNG heroes in production bundles |
| **CDN delivery** | `url()` / hosting+storage derived CDN (no separate `CDN_PROVIDER` knob) — default Cloudflare/R2 path; other hosts via existing provider resolve |
| **Cache** | Long-cache immutable fingerprints for optimized static assets; CDN/cache headers as the hosting adapter already documents — buyer never tunes cache manually |
| **Uploads** | User uploads still on-demand CDN transforms via storage+delivery providers |
| **Surfaces** | **Web:** `public/` + Next image/asset pipeline hooks. **Mobile:** optimized assets in bundle + `expo-image` / `url()` for remote. **Extension:** build-time only (`chrome-extension://`); no false CDN promises for packed assets |
| **Doctor / create validate** | When a kit project exists, doctor (or create post-check) confirms the assets package/hooks are wired (scripts present, optimize entry in build, no “raw public only” drift). Failures → one plain fix for the agent |
| **Agent skills** | `add-images` / `add-files` remain the buyer-facing paths; they must land on this pipeline automatically |

Buyer hears: “your pictures are optimized and load fast.” Never: sharp, SVGO, WebP codec, Cache-Control.

#### 8.2 Performance maximization — `web-perf-ci` skill (web, mobile, extension)

**Contract:** Every surface can get a **measured performance path**, not only “hope the CDN is fine.”

| Piece | Role |
|-------|------|
| **Skill: web-perf-ci** | Agent skill that wires lab (Lighthouse CI), field (CrUX), optional RUM (`web-vitals`), and Core Web Vitals budgets (LCP / INP proxy TBT / CLS). Source of truth for the harness: maintainer skill at `.agents/skills/web-perf-ci` (or kit-shipped wrapper). Doctor ensures it is **discoverable** for the detected agent (§4.10) after create |
| **Web** | Full harness: PR Lighthouse gate, post-deploy / weekly CrUX, optional RUM; budgets SSOT (e.g. LCP ≤ 2.5s, CLS ≤ 0.1, perf score ≥ 0.9) |
| **Mobile** | Surface-aware: JS bundle / startup / list jank guidance; reuse budget culture where applicable; store/EAS path stays via `eas`/`launch` doctor tools — perf skill adapts collect mode (no false “staticDistDir only” for Expo) |
| **Extension** | Bundle size + popup/sidepanel responsiveness; build-time asset optimize (§8.1); CI checks adapted to extension packaging |
| **go-live / onboarding** | Agent offers or runs perf improve steps before calling the app “fast enough”; never claim fixed without lab/field evidence when the skill is installed |
| **Buyer speech** | “making your app faster” / “speed checks” — never dump Lighthouse JSON |

Doctor **perf readiness** step (§4.7): after create, report whether web-perf-ci (or surface wrapper) is present and whether budgets/workflows exist; missing → one next action for the agent (“add speed checks”).

### 9. Deprecations and secondary verbs

| Verb | Role after this ADR |
|------|---------------------|
| `create app --…` | **Primary** human + scripted create path |
| `new` | Deprecated alias → `create app` or migration one-liner for one release window |
| `drop` | Advanced / agent merge-force-json; not marketed first create |
| `init` | Guardrails on an **existing** project |
| `list-presets` / `apply-preset` / `verify-presets` | Ready DB feature modules |
| `scaffold backend` / `backend add-*` | Ready API surface inside kit workspace |
| Page recipe install | Agent (+ optional future CLI) from kit catalog into OWNED app |
| `sync-agent-layer` / update-kit channels | Ongoing “latest improvements” |
| `env wizard` | TTY-only env fill after a workspace exists |
| `local-dev` | Visual sidecar when available |
| Other agent JSON verbs | `check-goals`, `plan-*`, `doc-fallback`, `dedup`, … |
| Skills + MCP (via doctor/setup) | Detect agents → install skills (global + project); wire curated MCPs |
| Assets + web-perf-ci | Automatic optimize/CDN/WebP; performance skill for web/mobile/extension |

Help and README lead with: **setup / doctor → create app → agent → add pieces / update**.
Agent verbs live under “More” / `help --all`.

### 10. Dual-track implementation (ordering)

**Track 1 — UX (front door):**

1. Bare-TTY main menu  
2. `create` / `create app` with `--web` \| `--mobile` \| `--extension`  
3. Shared success/error renderer  
4. `setup` honest next-step matrix  
5. Buyer-tier help documenting full doctor role + post-create add/update  
6. `new` deprecation redirect; unknown command errors  
7. Doctor: agent detect + skills install + MCP wire (even before full kit delivery)  

Until Track 2 ships, success copy must **not** promise public `npm i @vybekiit/*`.

**Track 2 — Delivery (kit workspace + catalogs + perf):**

1. ADR/CONTEXT alignment for clone layout and update-kit channel 1  
2. `resolveKitSource` used by `create app`  
3. Installable workspace (`workspace:*` resolves)  
4. Preset apply/verify works against buyer DB from that workspace  
5. Page recipe sources/manifest reachable for install into the app  
6. Backend scaffold from same kit source  
7. Assets pipeline validated on create/doctor (WebP + CDN + cache hooks)  
8. web-perf-ci (or wrappers) shipped/discoverable per surface  
9. Gate/invite aligned; retire orphan single-template create  

### 11. Example terminal journeys

**First run (interactive):**

```text
$ npx vybekiit
│ Welcome to VybeKiit
│ What do you want to do?
│ ● Set up my tools (first time)
│   Create an app
│   Check my tools
│   More…

$ npx vybekiit setup
│ (banner)
│ doctor: full toolchain pass…
✓ claude - ready
✓ codex - ready
✓ skills - ready
✓ gh - ready
✓ wrangler - ready (or login hint)
✓ supabase - ready (or login hint)
✓ agents detected: Claude Code, Cursor
✓ skills installed for Claude Code + Cursor (global helpers)
✓ tools connected for your assistant (core MCP: docs + GitHub)
…
Next: create your app
  vybekiit create app --web

$ npx vybekiit create app --web
✅ Created kit workspace + web surface
   (assets optimized path on; speed-check skill available)

Next (one step):
  Open this folder in your AI coding tool and say: "Set up my app."
```

**After create (agent / scripted):**

```text
vybekiit doctor                              # full pass: tools + project skills + MCP + assets + perf
vybekiit apply-preset orders --provider=supabase
vybekiit verify-presets --fix
vybekiit scaffold backend
vybekiit backend add-crud products
# agent installs a page recipe from the kit catalog into the web app
# agent: add-images → WebP/CDN; web-perf-ci → Lighthouse/CrUX gates
vybekiit sync-agent-layer
```

**Blocked gate (plain language only):**

```text
We couldn't find VybeKiit access for your GitHub account.
To get started, purchase VybeKiit at https://vybekiit.com …
```

## Consequences

- Buyer docs, landing CTAs, and onboarding skills converge on
  `npx vybekiit` / `setup` → `create app --web|…` → agent add/update — not `new web` alone.
- Doctor documentation and skills must describe the **full catalog + pipeline** (§4), not a
  partial subset. Selection remains sparse; inventory is complete.
- **Setup/doctor owns agent skills (global + project) and curated MCP wiring** for detected
  agents — not a post-hoc manual step for vibe coders.
- Post-create **presets, page recipes, backends, DB provisioning, assets/CDN/WebP, web-perf-ci,
  and update-kit** are part of the same journey contract as create — delivery must make them
  installable from the kit.
- ADR-0036’s bare menu is no longer aspirational: Track 1 implements it.
- ADR-0033’s external single-template follow-up is closed by Track 2 of this ADR.
- ADR-0005 remains private delivery via `gh`; create delivers **kit workspace + surface +
  catalogs**, not an orphan template with rewritten npm deps.
- ADR-0010 asset pipeline is a **create/doctor validation** requirement for template `public/`
  and project assets, not only a package design doc.
- Tests should lock: bare TTY vs non-TTY; create flags; setup next-step matrix; gate exempt
  list; doctor catalog completeness; agent-detect → skills/MCP; assets hooks; perf skill
  presence; preset/recipe/backend paths once Track 2 lands.

## Alternatives rejected

- **Keep `new <template>` as the primary verb** — hides multi-part delivery.  
- **App-only copy + public npm rewrite** — contradicts ADR-0033.  
- **Document doctor as “just install gh”** — under-delivers the agentic promise.  
- **Skills only project-local or only global** — breaks either first-run or multi-agent homes.  
- **Install every MCP in the catalog on setup** — tool bloat; curated core + provider sparse set.  
- **Raw `public/` assets with no optimize/CDN/WebP** — fights go-live performance promise.  
- **Perf only as tribal knowledge** — web-perf-ci must be discoverable for web/mobile/extension.  
- **Ship every page recipe into the app at create time** — bloated OWNED apps; catalog + install on demand.  
- **Presets/recipes only in maintainer monorepo** — buyers cannot apply/install after create.  
- **`setup` always prints “Ready”** — false green when doctor or gate still blocks.  
- **Invite full maintainer monorepo as only path** — leaks internals; prefer gated buyer kit.

## Related

- [ADR-0001](./0001-agentic-cli-toolchain.md) — doctor / agentic toolchain  
- [ADR-0005](./0005-template-distribution-mirrors.md) — private mirrors + `gh` clone  
- [ADR-0010](./0010-hybrid-asset-optimization-cdn.md) — hybrid assets, CDN, optimize/WebP  
- [ADR-0020](./0020-relational-db-feature-presets.md) — DB feature presets  
- [ADR-0033](./0033-cli-single-published-artifact-and-access-gate.md) — CLI-only publish + gate  
- [ADR-0034](./0034-code-style-and-dependency-catalog.md) / [ADR-0036](./0036-cli-command-surface-and-dual-mode.md) — dual-mode CLI  
- [CONTEXT.md](../../CONTEXT.md) — distribution, onboarding, update-kit, surface recipes  
- [LANGUAGE.md](../../LANGUAGE.md) — page recipe catalog, DB preset buyer phrasing, MCP wording  
- Implementation: `cli/src/cliRunner.ts`, `cli/src/commands/`, `cli/src/doctor/`,
  `cli/src/lib/agentDetection.ts`, `templates/*/.claude/mcp/`, `packages/db/presets/`,
  `scripts/data/page-recipe-manifest.json`, `apps/componentLibrary/src/pageRecipes/`,
  web-perf-ci skill (maintainer + kit wrappers)
