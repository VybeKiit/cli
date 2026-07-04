#!/usr/bin/env node
/**
 * Generate npm README.md for each @vybekiit/* package.
 * Run: node scripts/generatePackageReadmes.mjs
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = repoRootFrom(import.meta.url);

const HERO_URL = 'https://raw.githubusercontent.com/VybeKiit/vybekiit/main/assets/hero.webp';

const HERO = `<p align="center">
  <img src="${HERO_URL}" width="1000" height="1000" alt="VybeKiit">
</p>

`;

/** @type {Array<{ name: string; dir?: string; tagline: string; body: string; exports: string; config: string; skills: string; inScope: string; outScope?: string }>} */
const PACKAGES = [
  {
    name: 'core',
    tagline:
      'One secret-settings file, validated once — the brain every other VybeKiit package reads from.',
    body: 'Loads your `.env`, checks every value with Zod, and exposes typed config for payments, auth, database, hosting, and the rest. If a setting is missing or wrong, you get a clear error before anything runs.',
    exports: '`parseEnv`, `appConfigSchema`, `ok` / `err` / `fail`, `createLogger`',
    config:
      'All keys in the repo root `.env.example` — this package owns validation, not the values themselves.',
    skills: '`doctor`, `save-data`, any skill that reads settings',
    inScope: 'Env loading, Zod schemas, Result type, shared constants, structured logging.',
    outScope: 'No business logic, no UI, no provider adapters.',
  },
  {
    name: 'payments',
    tagline: 'Take money without picking a vendor — flip one setting to swap checkout providers.',
    body: 'Headless checkout and webhook verification. Lemon Squeezy is the default (handles global tax as Merchant of Record). Stripe and PayPal are one env flip away.',
    exports:
      '`resolvePaymentProvider`, `createLemonSqueezyProvider`, `createStripeProvider`, `createPayPalProvider`',
    config: '`PAYMENTS_PROVIDER` (default `lemon-squeezy`) + provider keys in `.env`',
    skills: '`setup-payments`, `go-live`',
    inScope: 'Checkout sessions, webhook signature verification, order events.',
    outScope: 'No pricing pages or checkout UI — those live in your app template.',
  },
  {
    name: 'auth',
    tagline: 'Let people sign in — your agent wires accounts without you touching auth code.',
    body: 'One auth interface with Better Auth bound to your database by default. Cognito adapter when you deploy on AWS.',
    exports: '`resolveAuthProvider`, `createBetterAuthProvider`, `createCognitoAuthProvider`',
    config: '`AUTH_PROVIDER` (default `better-auth`)',
    skills: '`add-signin`, `save-data`',
    inScope: 'Sign-up, sign-in, sessions, normalized user type.',
    outScope: 'No login screens — template UI calls the provider.',
  },
  {
    name: 'db',
    tagline: 'Where your app remembers things — database and file storage from one API.',
    body: 'Data and storage providers behind one interface. Supabase is the default. MongoDB, AWS, and R2/S3 adapters when you scale or change hosts.',
    exports: '`resolveDataProvider`, `resolveStorageProvider`, `pingDatabase`, `createDbClient`',
    config: '`DATA_PROVIDER` (default `supabase`), `STORAGE_PROVIDER` (default `supabase`)',
    skills: '`save-data`, `add-files`, `check-safety`, `doctor`',
    inScope: 'Typed data client, storage upload/read, health ping.',
    outScope: 'No ORM UI, no admin dashboards.',
  },
  {
    name: 'deploy',
    tagline: 'Put your app online — same deploy call for Cloudflare, Vercel, or AWS.',
    body: "Hosting adapter your agent uses in the go-live flow. Cloudflare is the default (matches the kit's edge-first stack).",
    exports:
      '`resolveHosting`, `createCloudflareHosting`, `createVercelHosting`, `createAwsHosting`',
    config: '`HOSTING_PROVIDER` (default `cloudflare`)',
    skills: '`go-live`',
    inScope: 'Deploy command, status checks, provider-specific CLI wiring.',
    outScope: 'No DNS registrar UI — agent guides browser steps when needed.',
  },
  {
    name: 'email',
    tagline: 'Send transactional email — welcome messages, receipts, alerts.',
    body: 'Provider-agnostic send API. Cloudflare Email is default; SES and Resend available via env.',
    exports: '`resolveEmailProvider`, `createCloudflareEmail`, `createSesEmail`',
    config: '`EMAIL_PROVIDER` (default `cloudflare`)',
    skills: '`setup-email`, `add-notifications`',
    inScope: 'Send transactional email, typed params.',
    outScope: 'No email templates UI — copy lives in your app.',
  },
  {
    name: 'tokens',
    tagline: 'One palette for web and mobile — change a color once, both stay in sync.',
    body: 'Shared design tokens (colors, spacing, radius, type). Web consumes CSS variables; mobile consumes StyleSheet values.',
    exports: '`colors`, `spacing`, `radius`, `fontSizes`, `cssVariables`, `hsl`',
    config: 'None — import tokens directly.',
    skills: '`add-screen`, styling skills in each template',
    inScope: 'Design token source of truth across platforms.',
    outScope: 'No components — templates own UI primitives.',
  },
  {
    name: 'observability',
    tagline: 'Catch crashes in production — silent no-op in dev until you turn on Sentry.',
    body: 'Error tracking adapter. Local no-op by default so dev stays quiet; plug in Sentry when you go live.',
import { repoRootFrom } from '../../lib/repoRoot.mjs';
    exports: '`resolveObservabilityProvider`, `createSentryObservabilityProvider`, `initSentry`',
    config: '`OBSERVABILITY_PROVIDER` (default `local`), `SENTRY_DSN` when using Sentry',
    skills: '`track-errors`',
    inScope: 'Init, capture, provider swap.',
    outScope: 'No error dashboard UI.',
  },
  {
    name: 'security',
    tagline: 'Built-in protection — rate limits and same-origin lock, on by default.',
    body: 'App-layer security guard driven entirely from env. Your agent enables or tunes it in the harden flow.',
    exports: '`SecurityGuard`, `resolveSecurityPolicy`, `RateLimiter`, `isOriginAllowed`',
    config: '`SECURITY_RATE_LIMIT`, `SECURITY_ORIGIN_LOCK` (both default `on`)',
    skills: '`harden`, `check-safety`',
    inScope: 'Per-IP rate limiting, origin lock, route classification.',
    outScope: 'Not a WAF — edge rules live in hosting config.',
  },
  {
    name: 'assets',
    tagline: 'Fast images — compressed at build time, served from your CDN.',
    body: 'Build-time optimization plus CDN URL helpers derived from your hosting and storage settings.',
    exports: '`resolveAssetDelivery`, `runOptimizeForBuild`, `getNextImageRemotePatterns`',
    config: 'Derived from `HOSTING_PROVIDER` + `STORAGE_PROVIDER`',
    skills: '`add-images`',
    inScope: 'Image optimize pipeline, remote pattern config for Next.js.',
    outScope: 'No `<img>` components — use template `VybeImage`.',
  },
  {
    name: 'agent-kit',
    dir: 'agentKit',
    tagline:
      'The rules your AI assistant follows — plain language, safe updates, one step at a time.',
    body: 'Shared agent-layer contract: the five buyer promises, jargon→plain vocabulary, and the kit-update planner. Template-specific skills stay in your app; this is what must never drift.',
    exports:
      '`CONTRACT`, `TOOL_VOCABULARY`, `planKitUpdate`, `planAgentLayerSync`, `SDLC_VOCABULARY`',
    config: 'None.',
    skills: '`update-kit`, `sync-agent-layer`',
    inScope: 'Buyer skill contract, tool vocabulary, update planning.',
    outScope: 'Not template onboarding flows — those live in `.vybekiit/skills/`.',
  },
  {
    name: 'browser-automation',
    dir: 'browserAutomation',
    tagline: 'Dashboard automation CLI for Lemon Squeezy and Chrome Web Store.',
    body: 'Unified Playwright package with registry CLI `vybekiit-automate`. Domains: extension (CWS), payments/ls. Store SSOT: `.vybekiit/store/`. Agent `--json` mode or interactive wizard.',
    exports: 'CWS verbs, `runLsSetup`, `standbyLogin`, `vybekiit-automate` CLI',
    config: 'Chrome profiles: `$HOME/.ls-chrome-profile`, `$HOME/.cws-chrome-profile`',
    skills: 'setup-payments, publish-extension',
    inScope: 'Blind DOM automation, verb registries, dual-mode CLI.',
    outScope: 'Runtime checkout — `@vybekiit/payments`.',
  },
  {
    name: 'client-state',
    dir: 'clientState',
    tagline: 'Client cache and UI prefs for web, mobile, and extension.',
    body: '`resolveClientState()` wires TanStack Query defaults and Zustand/MMKV UI store factories per surface.',
    exports: '`resolveClientState`, `createQueryClient`, `createUiStore`, `./mobile`',
    config: '`CLIENT_STATE_PERSIST`, `CLIENT_STATE_QUERY_STALE_SECONDS`',
    skills: 'client-state-vybekiit.md',
    inScope: 'TanStack Query 5.101.x, Zustand scaffold.',
    outScope: 'Server-side Redis — not a buyer path.',
  },
  {
    name: 'report-mode',
    dir: 'reportMode',
    tagline:
      'Report a bug in one hotkey — captures context and opens your AI assistant ready to fix it.',
    body: 'Dev-only Report Mode for vibe coders: structured reports, console error buffer, native assistant deeplink. Never ships to production builds.',
    exports:
      '`formatReportPrompt`, `buildAssistantDeepLink`, `ConsoleErrorBuffer`, `REPORT_MODE_HOTKEY_LABEL`',
    config: 'None — dev-only, tree-shaken from prod.',
    skills: 'Report Mode section in agent layer docs',
    inScope: 'Bug report formatting, deeplink handoff.',
    outScope: 'Not production error tracking — use `@vybekiit/core/observability`.',
  },
  {
    name: 'i18n',
    tagline: 'Multiple languages without framework glue — locales and message catalogs, headless.',
    body: 'Locale resolution and catalog loading your template wires into Next.js or Expo i18n.',
    exports: '`resolveI18nProvider`, `createLocalI18n`, `I18nProvider`',
    config: '`I18N_PROVIDER` (default `local`), `DEFAULT_LOCALE` (default `en`)',
    skills: '`add-language`',
    inScope: 'Locale lists, message catalog loader.',
    outScope: 'No translated UI — your app owns copy files.',
  },
  {
    name: 'seo',
    tagline: 'Help Google find you — sitemaps, robots.txt, and page metadata.',
    body: 'SEO primitives: metadata helpers, sitemap generation, JSON-LD blocks. Wired in template `seo.ts`.',
    exports: '`resolveSeoProvider`, `createLocalSeo`, metadata and sitemap types',
    config: '`SEO_PROVIDER` (default `local`)',
    skills: '`add-blog`, marketing pages',
    inScope: 'Sitemap, robots, metadata, GEO/JSON-LD helpers.',
    outScope: 'No content writing — you describe pages to your agent.',
  },
  {
    name: 'compliance',
    tagline: 'Cookie banner and data-export hooks — stay compliant without legal jargon.',
    body: 'Cookie consent config and export hooks your agent enables when you add analytics or store user data.',
    exports: '`resolveComplianceProvider`, `createLocalCompliance`, `CookieConsentConfig`',
    config: '`COMPLIANCE_PROVIDER` (default `local`), `COOKIE_CONSENT_ENABLED` (default `on`)',
    skills: '`harden`, privacy pages',
    inScope: 'Consent config, export hook interface.',
    outScope: 'Not legal advice — templates ship starter privacy/terms copy.',
  },
  {
    name: 'kv',
    tagline: 'Fast short-term memory — cache flags, rate counters, session hints.',
    body: 'Key-value store adapter. Cloudflare KV default; local in-memory fallback when unconfigured.',
    exports: '`resolveKvProvider`, `createCloudflareKv`, `createLocalKv`',
    config: '`KV_PROVIDER` (default `cloudflare`)',
    skills: '`harden`, feature skills that need caching',
    inScope: 'Get/set/delete, TTL, provider swap.',
    outScope: 'Not your primary database.',
  },
  {
    name: 'analytics',
    tagline: 'See who visits your app — privacy-friendly stats by default.',
    body: 'Visitor analytics adapter. Plausible default; PostHog when you want funnels and events.',
    exports: '`resolveAnalyticsProvider`, `TrackEvent`, `ScriptConfig`',
    config: '`ANALYTICS_PROVIDER` (default `plausible`), `PLAUSIBLE_DOMAIN`',
    skills: '`add-analytics`',
    inScope: 'Track events, script injection config.',
    outScope: 'No analytics dashboard UI.',
  },
  {
    name: 'jobs',
    tagline: 'Background tasks and scheduled jobs — reminders, cleanups, digests.',
    body: 'Jobs adapter for cron and queue workloads. Cloudflare Cron/Queues default.',
    exports: '`resolveJobsProvider`, `JobsProvider`, `JobPayload`',
    config: '`JOBS_PROVIDER` (default `cloudflare`)',
    skills: 'Feature skills that schedule work',
    inScope: 'Enqueue, schedule, provider binding.',
    outScope: 'No job admin UI.',
  },
  {
    name: 'notifications',
    tagline: 'Push, SMS, and email alerts — tell users when something happens.',
    body: 'Multi-channel notification send. Expo push default for mobile; email channel uses `@vybekiit/email`.',
    exports: '`resolveNotificationsProvider`, `SendNotificationParams`, `NotificationChannel`',
    config: '`NOTIFICATIONS_PROVIDER` (default `expo`)',
    skills: '`add-notifications`',
    inScope: 'Send notification, channel types.',
    outScope: 'No notification preference UI — agent builds on request.',
  },
  {
    name: 'search',
    tagline: "Search your app's content — full-text wired to your database by default.",
    body: 'Search adapter. Supabase full-text default; Typesense or Algolia when you outgrow it.',
    exports: '`resolveSearchProvider`, `SearchDocument`, `SearchHit`',
    config: '`SEARCH_PROVIDER` (default `supabase`)',
    skills: '`add-search`',
    inScope: 'Index, query, hit types.',
    outScope: 'No search UI — template adds search page.',
  },
  {
    name: 'realtime',
    tagline: 'Live updates — chat, presence, live dashboards without polling.',
    body: 'Pub/sub channels adapter. Supabase Realtime default.',
    exports: '`resolveRealtimeProvider`, `RealtimeChannel`, `RealtimeHandler`',
    config: '`REALTIME_PROVIDER` (default `supabase`)',
    skills: 'Feature skills for live features',
    inScope: 'Subscribe, publish, channel lifecycle.',
    outScope: 'No chat UI components.',
  },
  {
    name: 'tenancy',
    tagline: 'Teams and workspaces — org accounts without building from scratch.',
    body: 'Organization membership primitives. Better Auth + db default.',
    exports: '`resolveTenancyProvider`, `TenancyProvider`, `OrgMember`',
    config: '`TENANCY_PROVIDER` (default `better-auth`)',
    skills: '`add-teams`',
    inScope: 'Org CRUD, membership roles interface.',
    outScope: 'No team settings UI — agent adds screens on request.',
  },
  {
    name: 'ai',
    tagline: 'AI features in your app — one API for OpenAI, Claude, or OpenRouter.',
    body: 'Runtime LLM adapter your agent wires for chat, summaries, or generation features.',
    exports: '`resolveAiProvider`, `CompleteParams`, `CompleteResult`',
    config: '`AI_PROVIDER` (default `openai`), `OPENAI_MODEL` (default `gpt-4o-mini`)',
    skills: '`add-ai`',
    inScope: 'Complete/chat calls, provider swap.',
    outScope: 'No chat UI — your app owns screens.',
  },
  {
    name: 'cms',
    tagline: 'Blog and marketing pages from files in your repo — no separate CMS bill.',
    body: 'MDX content provider for blog posts and static marketing pages.',
    exports: '`resolveCmsProvider`, `CmsPage`, `CmsProvider`',
    config: '`CMS_PROVIDER` (default `mdx`), `CMS_CONTENT_DIR` (default `content`)',
    skills: '`add-blog`',
    inScope: 'Page listing, slug resolution, MDX metadata.',
    outScope: 'No WYSIWYG editor — you describe content to your agent.',
  },
];

function render(pkg) {
  const scope = `@vybekiit/${pkg.name}`;
  const outExtra = pkg.outScope ? `\n- ${pkg.outScope}` : '';

  return `${HERO}# ${scope}

${pkg.tagline}

**Part of [VybeKiit](https://vybekiit.com)** — maintained logic your scaffolded app depends on. You don't edit this code. When VybeKiit ships fixes, your agent runs the **update-kit** skill and version bumps install automatically — no merge conflicts.

## What it does

${pkg.body}

## In your app

Your template already imports this package. Settings live in your **secret settings file** (.env); validation lives in @vybekiit/core. Change behavior by updating env values or asking your agent to enable a feature skill — not by editing files inside node_modules.

## For your agent

- **Do not edit** node_modules/${scope} — fix bugs upstream or bump the package version.
- **Entry point:** ${pkg.exports}
- **Config:** ${pkg.config}
- **Related skills:** ${pkg.skills}
- **Pattern:** resolve*Provider() reads env via @vybekiit/core and returns a headless adapter.

## Scope

**In scope**

- ${pkg.inScope}${outExtra}

**Out of scope**

- UI components, screens, or copy — those are **owned** by your app template.
- Direct edits in node_modules — use update-kit instead.

## Updates

\`\`\`bash
npm update ${scope}
\`\`\`

Or run the **update-kit** skill — it uses planKitUpdate() from @vybekiit/agent-kit to bump all @vybekiit/* packages safely.

## Docs

- [VybeKiit monorepo](https://github.com/VybeKiit/vybekiit)
- [Owned vs Maintained](https://github.com/VybeKiit/vybekiit/blob/main/CONTEXT.md#the-architectural-backbone-owned-vs-maintained)
- Maintainer agent rules: [AGENTS.md](https://github.com/VybeKiit/vybekiit/blob/main/AGENTS.md) (for kit contributors only)

## License

MIT
`;
}

for (const pkg of PACKAGES) {
  const path = join(ROOT, 'packages', pkg.dir ?? pkg.name, 'README.md');
  writeFileSync(path, render(pkg));
  console.log(`Wrote ${path}`);
}

console.log(`Done — ${PACKAGES.length} READMEs.`);
