# ADR-0030: Safety scanner and leak catalog (go-live verification)

## Status

Accepted — 2026-07-04

## Context

Before a vibe coder ships, they (and we) need to know the app is production-safe: no leaked
secrets, no misconfigured deploy, no unprotected data. Two constraints shape the answer:

1. **Vibe coders do not trust agents.** An experienced one put it plainly: an agent *saying*
   "your app is safe" is worthless. The verdict has to come from something they can **read** and
   run themselves. So the check is a plain, deterministic **script** — not a skill that reasons,
   and not a compiled package hidden in `node_modules`. The skill only translates the script's
   output into plain language; it never decides the verdict.

2. **The value is the delta.** The kit already ships secure-by-default (ADR-0009): app + edge
   security guard, `parseEnv` validation, protected data routes. The scanner's job is to *prove*
   that, and to measure the gap between a kit-guided app and an untouched vibe-coded one. Most of
   what it checks is stack-shaped and universal (secrets, config, deps, risky code); one rung
   (sign-in & access) is where the kit's guidance concentrates, so it is the headline delta.

There is no `@vybekiit/security` package (the `harden` skill drives protection through readable
`SECURITY_*` env + template `middleware.ts`). `@vybekiit/compliance` is legal-compliance, not
security. So this is genuinely new, and the trust constraint decides where it lives.

## Decision

### 1. Ship as owned, readable, zero-dependency template scripts — generated from one source

The scanner is **owned** template code, self-contained per ADR-0029, pure Node, no dependencies. A
vibe coder can open it and read exactly what is checked. It is **not** a maintained npm package — a
black box in `node_modules` would defeat the entire trust premise.

Because the mirror ships only `templates/<name>/` (flattened) and a buyer only ever scaffolds one
stack, "import from one shared place" cannot survive scaffold except as a published package (rejected
above) or a co-located copy. So the SSOT is **generated, not duplicated**:

- **One source** — `scripts/dev/safety/{safety-catalog.mjs, safety-scan.mjs}` (excluded from buyer
  delivery). The catalog (what counts as a leak) and the scanner engine (how it looks + the report)
  are identical everywhere and edited only here.
- **`safety:sync`** copies both, verbatim and readable, into every `templates/*/scripts/`. Buyers
  still receive plain files they can read; they are generated from one place, not hand-maintained
  five times.
- **Drift gate** — `check:safety` runs `sync --check` (byte-compare; fails on any hand-edit of a
  generated copy) then the runner (`scripts/dev/checks/safetyScan.mjs`) across all five templates,
  and is wired into `pnpm verify`. A drift, or a template shipping a preventable leak, blocks the
  pre-push gate. This mirrors how the agent layer is kept in sync (`checkTemplateAgentLayer`).
- **One hand-written file per stack** — `safety-profile.mjs` (~8 readable lines) is the only
  per-template surface, and `sync` never touches it.

### 1a. The per-stack profile (correctness, not just DRY)

Five stacks expose secrets differently, so the profile is where the check stays honest per stack:

| Stack | `publicPrefix` | `everythingShips` | sourcemap config |
|---|---|---|---|
| web (Next.js) | `NEXT_PUBLIC_` | no — server code stays server-side | `next.config.ts` |
| mobile (Expo) | `EXPO_PUBLIC_` | **yes** — JS bundle ships in the app | — (metro) |
| spa (Vite) | `VITE_` | **yes** — an SPA ships all its code | `vite.config.ts` |
| extension (WXT) | `WXT_PUBLIC_` / `VITE_` | **yes** — ships to every installer | `wxt.config.ts` |
| backend (Express) | none | no — no client bundle | — |

`everythingShips` closes a real hole: on an SPA / mobile app / extension a bare hard-coded key in
source is **visible to visitors** even with no public prefix, because the whole bundle ships. The
web-only tracer classified that as merely `code`; per-stack it is correctly `code+public`. Two
profile-driven rules landed with the rollout: a real secret behind a **public-prefixed name in an
`.env`** is flagged `public` (it gets inlined) even when the file is untracked; and on
`everythingShips` stacks any source-file secret (excluding build config) is `public`.

### 2. The five-rung ladder (easiest to spot → hardest)

| # | Rung | Severity | Whose problem |
|---|---|---|---|
| 1 | Secrets exposure | 🔴 critical | everyone |
| 2 | Config & deploy | 🟠 high | everyone |
| 3 | Dependencies | 🟠 high/med | everyone |
| 4 | Sign-in & access | 🔴 critical | **the kit's delta** |
| 5 | Risky code (SAST) | ⚫ varies | everyone |

Rungs 1–3 and 5 are stack-shaped (any project). Rung 4 is where guided builds pull ahead, so
`kitPreventable: true` findings there feed the delta headline.

### 3. Every finding carries the same eight fields, with two faces

`id · rung · severity · detect · leakPaths · proof · plain(+tooltip/consequence/remediation) ·
kitPreventable`. Two faces of one record:

- **Engineer face** (deterministic, hidden): rung, severity, rule id, `file:line`, `kitPreventable`.
- **Vibe-coder face** (plain, localized `{en, he}`): a plain title → what could happen → the one
  fix → a traffic light. Plus an ⓘ tooltip one notch deeper, and 🛡️ defense-in-depth remediation.

`proof` is `{ file, line, abs, snippet }` and renders as a **clickable path** that opens the exact
line in Cursor or VS Code (`cursor://file//<abs>:<line>`, `vscode://file//<abs>:<line>`) — so the
finding proves itself; the reader is never asked to take our word.

### 4. Seven leak paths (the detection axis for rung 1)

One secret can escape seven ways. The scan checks each independently so the report can say, in
plain words, which are true: **code · git · public · client-bundle · api-reply · logs · sourcemap**.
A key in an *untracked* `.env` is the correct place and is **not** reported — unless its name carries
the stack's public prefix, which inlines it into the shipped bundle. Only a real escape is reported.

### 5. The catalog is the single source of truth for the plain-language bridge

`safety-catalog.mjs` holds every case, its `{en, he}` plain strings, tooltip, consequence, and
remediation (fix + defense-in-depth). The report, this ADR, and the planpage plan all read from it.
No jargon reaches the buyer; no em dashes in buyer prose (kit rule).

### 6. Gate at go-live, silent backstop in CI

`check-safety` runs the scan at go-live and shows the localized report (the gate the buyer sees).
The monorepo runner backs it in the online checker (`ci.yml`) so a regression can never ship
silently. Exit is non-zero when a critical is unresolved, unless `--report-only`.

### 7. The buyer report

Self-contained HTML in the buyer's language (Tailwind + fonts + brand logos from CDN), a
traffic-light headline, one card per finding with proof, leak-path checklist, the one fix, and
defense-in-depth. The scanner emits it directly today (zero-dep trust artifact); `check-safety` may
later render it through **planpage** for the interactive decision loop.

## The full case map (99% coverage target)

**Rung 1 — Secrets (19 families × 7 leak paths).** Families: OpenAI, Claude/Anthropic, Stripe
(secret + restricted), AWS, Google API key, Google OAuth secret, GitHub token, GitLab token, Slack
token, SendGrid, Resend, Twilio, npm token, private-key files, sign-in/JWT secret, database URL with
password, Mailgun, and a **named-secret catch-all** (any long value on a variable named
`*SECRET*/*TOKEN*/*API_KEY*/*PASSWORD*/*ACCESS_KEY*/*SERVICE_ROLE*` — covers Supabase service-role,
Cloudflare tokens, Lemon Squeezy keys, and anything new). Each × {code, git, public, client-bundle,
api-reply, logs, sourcemap}. High-value families carry a money-specific consequence and a
defense-in-depth (OpenAI/Anthropic spend cap, AWS billing alert, Stripe restricted key, DB password
rotation).

**Rung 2 — Config & deploy.** `config.sourcemaps-public` (readable code shipped),
`config.env-committed` (a real `.env` in history), `config.security-off` (`SECURITY_*` toggled off),
`config.cors-wildcard` (any site may call credentialed routes). Extensible: missing security
headers, debug left on, verbose prod logging.

**Rung 3 — Dependencies.** `deps.known-vuln` (audit high/critical), `deps.abandoned` (unmaintained).

**Rung 4 — Sign-in & access (the delta).** `authz.route-unprotected` (data route with no session
check), `authz.missing-ownership` (returns records not filtered by owner — the classic IDOR),
`authz.rls-off` (database-level lock disabled).

**Rung 5 — Risky code.** `sast.dangerous-html` (raw HTML from input), `sast.eval` (text run as
code), `sast.raw-sql` (string-built queries), `sast.open-redirect` (forward to attacker site).

**Detection status.** Rolled out to all five templates (web, mobile, spa, extension, backend) from
the one generated source. Implemented today: all rung-1 families across code/git/public/logs, with
*public* determined per stack (public-prefixed `.env` names, and whole-bundle stacks where all source
ships); rung-2 sourcemaps (per-stack config file) + env-committed + security-off; rung-5
dangerous-html/eval/raw-sql. Cataloged with detection phased: client-bundle + api-reply leak paths
(need a build / a running app), CORS wildcard, dependency audit wiring, and the rung-4 authz cases
(need route + query analysis). An optional `--deep` mode may later shell out to semgrep/gitleaks; the
zero-dep core stays the readable default.

## Consequences

- Owned scripts in every template's `scripts/`, generated from `scripts/dev/safety/` and drift-gated
  by `check:safety` in `pnpm verify` (the ADR-0029 loop). One `safety-profile.mjs` per stack is the
  only hand-written surface. `check-safety` gains a scan step ahead of its manual audits.
- The catalog `{en, he}` strings become the localization surface for verification copy; new locales
  extend it like any message catalog.
- The `kitPreventable` flag doubles as the marketing/QA delta signal (guided vs untouched) and a
  regression alarm if a template starts shipping a preventable finding.
- Because the scanner is readable and runs locally, the vibe coder can trust the verdict without
  trusting the agent — which was the whole point.
