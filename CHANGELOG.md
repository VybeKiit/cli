# Changelog

All notable changes to the VybeKiit kit, generated from git history by
`scripts/dev/changelog/generateChangelog.mjs` — do not edit by hand (ADR-0041).

Format follows [Keep a Changelog](https://keepachangelog.com); versions are kit
release-line tags (ADR-0013).

## [Unreleased]

### Added

- **landing:** hover language switcher + EN/HE/RU/AR visitor copy ([#78](https://github.com/VybeKiit/vybekiit/pull/78))
- **landing:** pricing polish, perf shells, built-with note ([#75](https://github.com/VybeKiit/vybekiit/pull/75))
- **recipes:** make PricingPage a production-ready recipe
- **recipes:** make AuthPage a production-ready recipe
- **componentLibrary:** production-ready Checkout page recipe + authoring bar
- **payments:** LS webhook admin module + ls:webhooks CLI
- **landing:** record orders in Cloudflare D1 (one orders table)
- **browser-automation:** generic money-pipeline verification (ls verify-checkout)
- **landing:** SEO — robots, sitemap, OG image, JSON-LD, full metadata
- **agent-kit:** hooks, MCP, and platform adapters
- **ui:** private @vybekiit/ui component library package
- **dedup:** Rust duplicate-export gate tool (ADR-0031)
- **browser-automation:** provider token/key automation + toolchain (ADR-0032)
- **templates/web:** add agent runtime configs, CI hardening, catalog refresh and skill updates
- **templates/spa:** add agent runtime configs, CI and gitignore hardening
- **templates/mobile:** add agent runtime configs, CI hardening and skill updates
- **templates/extension:** add agent runtime configs, CI hardening and skill updates
- **templates/backend:** add agent runtime configs and railway skill updates
- **landing:** refresh landing styles, add AI tool brand marks and wrangler state
- **agentKit:** expand supported agent runtimes and tool skill paths
- **hardening:** D1-D8 hardening
- **browser-automation:** complete the Google OAuth consent flow
- **browser-automation:** one-shot Google OAuth setup domain
- **landing:** deploy to Cloudflare via OpenNext + partner referral SSOT
- **component-library:** honest catalog + light/dark + global color picker
- **landing:** add Hero product stack orbit with 3D brand marks
- **cli:** add agent layer render/sync and skill discovery
- **cli:** extend doctor for Railway, Codex skills, and dispatch
- **agent-kit:** add buyer skill stubs and extension skill lint
- **agent-kit:** add platform skills audit and manifest merge
- **db,deploy:** add Railway stack adapters (ADR-0017)
- **core:** add provider dispatch SSOT (ADR-0018)
- **gate:** include spa mirror in default GitHub gate repos
- **agent-layer:** enforce patterns, PostHog/Sentry wave, and landing hints
- **landing:** add vibe hints on brand marks with hero domino cascade
- **landing:** flat brand mark WebPs and remove 3d asset pipeline
- **templates:** MCP tier for Supabase, Stripe, and PayPal
- **templates:** wire browser-automation skills and buyer store scaffolds
- **browser-automation:** add unified CWS and Lemon Squeezy automation package
- **extension:** wire client-state provider in popup entrypoint
- **mobile:** wire client-state with MMKV query persist
- **db:** export neon and firebase adapters from package entry
- **release:** production readiness — CI fix, release/publish workflows, landing polish
- **dist:** mirror all five delivery repos, populate-ready (ADR-0005)
- **landing:** inspirations gallery (#35) + Terminal-to-Live hero ([#36](https://github.com/VybeKiit/vybekiit/pull/36))
- **landing:** marketing site scaffold and workspace promotion
- **templates/extension:** v3 agent layer and skills bridge
- **templates/mobile:** skills bridge buyer layer parity
- **templates/web:** skills bridge buyer layer and language parity
- **cli:** sync-agent-layer command for update-kit channel 2
- **agent-kit:** agent-layer sync and platform skills planners
- **templates:** Layer B platform wrapper skills
- **templates/mobile:** pin expo agent skills suite
- **templates/web:** pin vercel-labs agent skills
- **templates:** platform skills manifest, pin script, and CI step
- **deploy:** add Vercel hosting adapter as opt-in provider
- **ci:** one-way template mirror sync (script + workflow)
- **cli:** clone the private mirror to scaffold; add gh to doctor
- **agent-kit:** shared agent-layer package + Cursor support + tool-vocabulary
- **mobile:** buyer agent layer + skills + Expo/EAS/launch doctor tools (#19, #15)
- **mobile:** Expo template at web parity — StyleSheet primitives + screens + launch config ([#19](https://github.com/VybeKiit/vybekiit/pull/19))
- **web:** reusable hooks + fetch helper + toast + test setup ([#16](https://github.com/VybeKiit/vybekiit/pull/16))
- **agent:** six goal-named skills + provider-aware doctor + data maps (#14/#15)
- **auth:** AuthProvider interface — better-auth (DB-bound) + Cognito (AWS) — ADR-0003
- **aws:** hosting (Amplify) + storage (S3) + email (SES) adapters; fix web typecheck ordering
- **db:** MongoDB (Atlas) + AWS (DynamoDB) data adapters behind DataProvider
- **packages:** provider-interface seams (data/storage/hosting/email) + @vybekiit/tokens
- **web:** scaffold-ready buyer page layouts on a shadcn foundation

### Changed

- **spa:** convert first-party default exports to named exports
- **spa:** convert parent-relative imports to the @/ alias
- **landing:** PascalCase the first-party component files
- **reportMode:** camelCase the use-*.ts hook files
- **tests:** colocate all 103 package tests beside their subjects
- **email+notifications:** fold into web as owned code (ADR-0025) + Effect schema migration
- **assets:** fold @vybekiit/assets into web + mobile + extension (ADR-0025)
- **analytics:** fold @vybekiit/analytics into web + backend (ADR-0025)
- **realtime:** fold @vybekiit/realtime into web + spa as owned code (ADR-0025)
- **i18n:** fold the pure locale-rules surface into mobile + spa (ADR-0025)
- **concerns:** fold 7 web-only leaf concerns into the web template (ADR-0025)
- **seo:** fold @vybekiit/seo into the web template as owned code (ADR-0025)
- **auth:** absorb Twilio SMS-OTP from notifications; sever auth→notifications (ADR-0025)
- **core:** absorb http/observability/security as subpaths (ADR-0025)
- **packages:** privatize agent-kit + browser-automation; bundle into CLI (ADR-0025)
- **packages:** privatize deploy + ui-catalog-mcp (ADR-0025)
- **landing:** restyle landing components; sync CI workflows and templates
- **landing:** camelCase renames + Effect consumers
- **cli:** Effect + camelCase file renames
- **templates:** Effect consumers + camelCase + edge-runtime build fixes
- **packages:** migrate to Effect (tagged errors, Schema, Layers) + camelCase folders/files
- deepen CLI and maintained packages from architecture review
- **agent-kit:** clean module layout and expand vocabulary
- **packages:** migrate resolve.ts to core dispatch

### Fixed

- **browserAutomation:** idempotent Google OAuth URI patch from anywhere
- **release:** cap turbo concurrency to avoid runner OOM cancel ([#80](https://github.com/VybeKiit/vybekiit/pull/80))
- first-run kit workspace + release bump for nested packages ([#79](https://github.com/VybeKiit/vybekiit/pull/79))
- **scripts:** force-track checkPageRecipes.mjs gate entrypoint ([#77](https://github.com/VybeKiit/vybekiit/pull/77))
- **landing:** gate sends User-Agent + serial invites; wire D1 binding
- **browser-automation:** mint CF tokens at the account-scoped URL ([#66](https://github.com/VybeKiit/vybekiit/pull/66))
- **ci:** componentLibrary build tolerates a missing sync:ui catalog ([#63](https://github.com/VybeKiit/vybekiit/pull/63))
- **ci:** green typecheck/test — pageRecipe casing + walkthrough module
- **d1-d8:** resync brand assets to SSOT + finish web cnfast migration
- **landing:** resolve TS7030 in a biome-stable way
- **analytics:** read web env via nodeEnv shim so biome stops re-adding node:process
- **ci:** install Chromium in the test leg for browser-automation's field-locator suite
- **mirror:** drop unmade spa/backend targets, reconcile to ADR-0005's five delivery repos
- **hooks:** repair pre-push pin-skills path broken by the camelCase rename
- **ci:** scope checks leg to cold-safe checks; keep check:templates pre-push
- **landing:** drop non-hermetic brand-mark generation from build
- **templates/web:** declare cmdk, embla-carousel-react, react-day-picker
- **ci:** activate pnpm via corepack in gate legs for act compatibility
- **web:** read process via globalThis seam and exclude instrumentation from biome
- **i18n:** add browser-safe locale-rules subpath for SPA and mobile
- **web:** avoid explicit node:process imports that break client bundle
- satisfy typecheck on optional reads and landing demo effects
- **browser-automation:** restore optional text return on field read failure
- **cli:** satisfy typecheck in optional file and live-docs parsers
- **cli:** restore explicit undefined returns for typecheck after biome format
- **templates:** sync backend onboarding skill stub after render
- **landing:** satisfy useEffect return type in agent session demo
- **web:** remove explicit node:process imports breaking Next build
- **landing:** emit biome-formatted brand-marks manifest from generator
- **web:** remove node:process import breaking client bundle
- **cli:** restore returns in empty catch blocks after biome format
- **browser-automation:** restore return in readOptionalText catch path
- resolve nested ternary biome errors blocking quality gate
- **cli:** add setup command and welcome banner
- **mirror:** skip spa delivery mirror until VybeKiit/spa repo exists
- **web:** drop unused shadcn primitives that broke strict template build
- **web:** satisfy biome a11y on breadcrumb and input-otp primitives
- drop legacy web routes superseded by [locale] layout
- remove duplicate CLI modules and WIP backend realtime stub
- remove orphan socket-io realtime test
- restore CI after branch merges — spa catalog entries, drop WIP realtime stubs, exclude spa assets from lint
- resolve merge-duplicate declarations from branch integration
- **web:** resolve landing grid and auth-telemetry test type errors
- **cli:** omit Supabase CLI for MCP-first data providers
- **agent-kit:** emit FK columns for all relation types in SQL migrations
- **hooks:** pre-push gate skips mirror remotes; mirror CI's test:scripts
- **cli:** satisfy typecheck in sync-agent-layer test mock
- align save-data skill naming in code and onboarding copy

### Other

- restore multilang READMEs, recipe rebuilds, and local fixes ([#76](https://github.com/VybeKiit/vybekiit/pull/76))
- **landing:** flip LEMONSQUEEZY_TEST_MODE to false (go live)
- ignore .wrangler/state recursively (nested apps use D1)
- **d1-d8:** commit in-flight hardening WIP before main merge
- **code-style:** close CODE-STYLE gaps + wire lint enforcement
- checkpoint D1-D8 hardening work
- specify page recipe catalog
- preflight scripts + competitive-features doc
- regex example comments + durable UI-registry sync transform
- **dist:** publish CLI only, privatize all @vybekiit/* packages (ADR-0033)
- wire e2e into pnpm verify + update AGENTS.md docs
- add Playwright tests for local-dev (agent-switch, session-load, workflow-real) + mock daemon
- Playwright tests for local-dev agent switch, session load, workflow real
- browser-automation: Supabase + Cloudflare stubs with .env key guard
- local-dev: new localDevelopmentWebsite with real workflows and multi-agent sessions
- update docs, husky hook, landing tsconfig
- update sections and styles
- remove dead fixture, guard junk dirs in .gitignore
- add tsup workspace alias declarations and biome backup
- update agent contract and code-style rules
- document scripts/dev/ convention (gitignored)
- apply biome formatting (line-wrap collapse, type-only import markers)
- **templates:** pin regenerated use-railway skill + format landing components
- collapse published surface to 5 + split structure docs (ADR-0025)
- sync pinned platform skills (posthog + feature-flags + eas-simulator)
- sync pinned platform skills (mongodb refresh + web-to-native)
- ignore .pi/ skills-CLI cache directory
- remaining root config + camelCase stragglers
- **scripts:** remove stale image-gen scripts; camelCase; regex comments
- decompose gate into act-runnable reusable legs + CI Gate; add .actrc
- **deps:** add effect + @effect/vitest, drop zod, vitest 2->3; sync lockfile
- adopt Effect end-to-end (ADR-0023); camelCase files + regex rule in CODE-STYLE/AGENTS
- format component library catalog for biome pre-push lint.
- sync pinned platform skill stubs and skills-lock after quality gate.
- Regenerate component library catalog index after UI registry expansion.
- Register add-realtime goal in catalog and sync web buyer skill stubs.
- Update mirror-repos tests for SPA and backend delivery mirrors.
- Update extension i18n test for underscore Chrome message key names.
- Fix SPA rich text editor Tiptap extension typing for pre-push typecheck.
- Scope component-library typecheck to catalog shell and sync lockfile for Radix deps.
- Exclude mirrored registry namespaces from web typecheck and add missing Radix UI deps.
- Fix browser-automation typecheck for Chrome launch API and registrar env parsing.
- Fix payments HTTP test typing for practice completion response body.
- Pass test mode and enabled variant options into Lemon Squeezy checkout creation.
- sync workspace manifests, env example, and lockfile for round-3 features.
- Add component library app with landing showcase and Pages deploy workflow.
- Update web checkout fulfillment, practice mode, and buyer goal skills.
- Wire SPA checkout page and align mobile and backend template dependencies.
- Ship extension sidepanel scaffold with auth shell and billing wire points.
- Expand web template with mirrored registry blocks, shadcn primitives, and demos.
- Expand UI registry sync, catalog index builder, and agent vocabulary.
- Add Supabase order migration, RLS policies, and domain provision script.
- Add CLI presets command and doctor verify steps for email, registrars, and DB.
- Extend better-auth tenancy provider for preset user profile bridge.
- Add registrar credential onboarding via browser-automation (ADR-0021).
- Improve Lemon Squeezy dashboard auth flow and variant verification.
- Harden browser-automation core with Chrome launch, profile resolve, and redirect waits.
- Add registrar API clients and Cloudflare zone helpers to deploy package.
- Add Cloudflare email worker contract and provider integration.
- Add relational DB feature presets with Postgres-first provider support.
- Replace http-client with @vybekiit/http and wire auth, payments, and security handlers.
- Add Node env loader and expand core config resolution.
- Fix createAuthClient test typing for generic postJson mock.
- update lockfile for round-2 template and package dependencies.
- Add backend checkout and webhook pipeline with shared payment handlers.
- Adopt http-client and query persistence in the extension template.
- Add SPA auth and billing wire points with SignInForm integration.
- Wire mobile auth-client through createAuthClient with MSW tests.
- Collapse web provider registry and wire security plus persistence.
- Add Express security middleware adapter.
- Add shared payment HTTP handlers and practice-mode helper.
- Add createAuthClient factory for template auth wire points.
- Fall back unshipped provider adapters to local implementations.
- Deepen auth session seam and collapse duplicated HTTP handlers.
- **mobile:** sync platform skills lock after architecture refactor
- keep instrumentation.ts out of biome node:process injection
- **templates:** pin use-railway skill and sync onboarding stubs
- clarify bridge login requires quitting daily Chrome
- **landing:** format brand-marks-3d catalog
- apply biome formatting across maintained packages
- add ADRs, update maintainer guides, and checklist scaffold
- **templates:** sync agent layer, skills, and platform pins
- **scripts:** add platform skills and agent layer CI gates
- Gate agent wiring with agnix and runtime compliance checks.
- sync tech-references from platform skills pin
- sync platform skills pin output
- sync CONTEXT after pin-platform-skills
- defer spa template agent-layer gate until skills are synced
- defer spa template agent-layer gate until skills are synced
- expect spa mirror in default delivery mirror set
- Co-authored-by: Cursor <cursoragent@cursor.com>
- **browser-automation:** apply formatter output from pre-commit hook
- wire monorepo for browser-automation SSOT
- remove extension-publish package
- update CONTEXT and env example for client-state policy
- **skills:** align save-data and react patterns for MCP-tier providers
- **skills:** add client-state, data-model, and browser-automation guides
- **web:** document client-state hooks and theme token usage
- **scripts:** register client-state and browser-automation packages
- **client-state:** add package README and CONTEXT glossary
- **kv:** clarify agent-only scope and no Redis buyer path
- **adr:** add client-state and browser-automation decisions
- npm first publish OTP runbook
- format asset manifests
- apply biome format and lint fixes
- ADR-0007, CONTEXT skills inventory, and positioning research
- ignore local artifacts and pinned agent skills in Biome
- record multi-provider adapter widening (ADR-0002/0003/0004) + expand language.md

## [0.3.0] - 2026-06-30

### Added

- **templates:** web lib hardening and shared UI primitives
- **landing:** cinematic landing with showcase carousel and brand marks
- **report-mode:** dock, inspect, handoff, and tutorial improvements
- **agent:** platform skills and MCP for Neon, Firebase, and AWS
- **packages:** add ui-catalog-mcp server for agent component discovery
- **ui:** registry sync pipeline and mirrored component catalog

### Fixed

- **client-state:** annotate MMKV persister return type for dts build
- **landing:** use no-op effect cleanup for strict TypeScript builds
- **assets:** write trailing newline in asset-manifest.json
- **extension:** resolve wxt/utils/storage for workspace report-mode
- **landing:** satisfy strict useEffect and chart payload types
- **extension:** use outline variant for highlight reset button

### Other

- **mobile:** format root layout for biome gate
- format client-state package and fix landing effect cleanups
- sync platform skills and optimized assets after rebase
- **mobile:** sync optimized asset outputs from build pipeline
- add inspect highlight glossary term to CONTEXT
- **release:** v0.3.0 — pin platform skills and bump kit semver
- update CONTEXT, AGENTS, env example, and maintainer guides
- **lint:** relax biome rules for UI mirrors and report-mode
- **release:** pin platform skills for v0.1.1

## [0.1.1] - 2026-06-29

### Fixed

- **release:** unblock npm publish when mirror sync fails ([#48](https://github.com/VybeKiit/vybekiit/pull/48))

### Other

- **release:** v0.1.1
- **release:** pin platform skills for v0.1.0

## [0.1.0] - 2026-06-29

### Added

- **release:** production readiness — CI, release workflows, landing polish ([#45](https://github.com/VybeKiit/vybekiit/pull/45))
- **extension:** wire dev Report Mode in popup with dock and handoff
- **mobile:** wire dev Report Mode with dock and modal handoff
- **web:** wire dev Report Mode shell, dock, and assistant handoff
- **cli:** surface Report Mode assistant hints in doctor
- **agent-kit:** add Report Mode UI vocabulary
- **report-mode:** complete @vybekiit/report-mode package
- **seo:** extend @vybekiit/seo with GEO primitives and wire web template
- **security:** secure-by-default vertical + delivery READMEs (ADR-0009)
- **dist:** mirror all five delivery repos, populate-ready (ADR-0005) ([#42](https://github.com/VybeKiit/vybekiit/pull/42))
- **landing:** inspirations gallery (#35) + Terminal-to-Live hero (#36) ([#41](https://github.com/VybeKiit/vybekiit/pull/41))
- **db,auth:** local dev adapter — fresh scaffold runs with no secrets (ADR-0008) ([#40](https://github.com/VybeKiit/vybekiit/pull/40))
- landing page + platform skills + agent-layer sync (#3) ([#34](https://github.com/VybeKiit/vybekiit/pull/34))
- **ci:** one-way template mirror sync (script + workflow) ([#33](https://github.com/VybeKiit/vybekiit/pull/33))
- **cli:** clone the private mirror to scaffold; add gh to doctor ([#32](https://github.com/VybeKiit/vybekiit/pull/32))
- **agent-kit:** shared agent-layer package + Cursor support + tool-vocabulary ([#31](https://github.com/VybeKiit/vybekiit/pull/31))
- **mobile:** buyer agent layer + skills + Expo/EAS/launch doctor tools (#19, #15) ([#30](https://github.com/VybeKiit/vybekiit/pull/30))
- **mobile:** Expo template at web parity — StyleSheet primitives + screens + launch config (#19) ([#29](https://github.com/VybeKiit/vybekiit/pull/29))
- **web:** reusable hooks + fetch helper + toast + test setup (#16) ([#28](https://github.com/VybeKiit/vybekiit/pull/28))
- **agent:** six goal-named skills + provider-aware doctor + data maps (#14/#15) ([#27](https://github.com/VybeKiit/vybekiit/pull/27))
- **auth:** AuthProvider interface — better-auth (DB-bound) + Cognito (AWS) — ADR-0003 ([#26](https://github.com/VybeKiit/vybekiit/pull/26))
- **aws:** hosting (Amplify) + storage (S3) + email (SES) adapters; fix web typecheck ordering ([#25](https://github.com/VybeKiit/vybekiit/pull/25))
- **db:** MongoDB (Atlas) + AWS (DynamoDB) data adapters behind DataProvider ([#24](https://github.com/VybeKiit/vybekiit/pull/24))
- **packages:** provider-interface seams (data/storage/hosting/email) + @vybekiit/tokens ([#23](https://github.com/VybeKiit/vybekiit/pull/23))
- **web:** scaffold-ready buyer page layouts on a shadcn foundation ([#21](https://github.com/VybeKiit/vybekiit/pull/21))
- **web:** promote templates/web to a workspace member + CI gate (#2) ([#12](https://github.com/VybeKiit/vybekiit/pull/12))
- **cli:** add `vybekiit doctor` — provision + verify the agentic toolchain ([#11](https://github.com/VybeKiit/vybekiit/pull/11))

### Changed

- rename @vybekiit/browser-automation → @vybekiit/extension-publish ([#10](https://github.com/VybeKiit/vybekiit/pull/10))

### Fixed

- **release:** skip husky pre-push on CI bot pushes. ([#47](https://github.com/VybeKiit/vybekiit/pull/47))
- **report-mode:** avoid WXT storage auto-import collision
- gate green on report-mode deeplink test and biome format
- **hooks:** pre-push gate skips mirror remotes; mirror CI's test:scripts ([#43](https://github.com/VybeKiit/vybekiit/pull/43))

### Other

- Add npm READMEs for all @vybekiit/* packages. ([#46](https://github.com/VybeKiit/vybekiit/pull/46))
- sync extension asset manifest after optimize-assets
- Report Mode glossary, buyer voice, and skill updates
- update lockfile for report-mode workspace dependencies
- format extension asset-manifest.json
- pin platform skills after GEO template sync
- **voice,license:** expand buyer glossary (4 clusters) + finalize LICENSE/EULA split (#18) ([#39](https://github.com/VybeKiit/vybekiit/pull/39))
- record multi-provider adapter widening (ADR-0002/0003/0004) + expand language.md ([#22](https://github.com/VybeKiit/vybekiit/pull/22))
- harden gate (pre-push mirrors CI, max-strict TS) + capture grill decisions ([#9](https://github.com/VybeKiit/vybekiit/pull/9))
- provider-agnostic payments + @vybekiit/browser-automation + CI badge ([#1](https://github.com/VybeKiit/vybekiit/pull/1))
- scaffold VybeKiit monorepo (v1.0)
