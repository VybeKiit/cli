import { z } from 'zod';
import { DEFAULT_APP_URL } from './constants';

/**
 * Typed, validated configuration for VybeKiit.
 *
 * Why per-concern schemas instead of one giant object: config is validated at the
 * boundary that actually uses it. The web client only needs Supabase + app URL;
 * the order webhook needs the GitHub gate token. Each package parses only its own
 * slice via {@link parseEnv}, so a feature never fails because an *unrelated*
 * group of keys is blank. This keeps the single `.env.example` as the one source
 * of truth while letting each consumer require only what it touches.
 */

/** A readable view of `process.env` that doesn't require `@types/node` here. */
type EnvSource = Record<string, string | undefined>;

/** Minimum log level — optional override; {@link resolveDefaultLogLevel} applies when absent. */
const logLevel = z.enum(['debug', 'info', 'warn', 'error', 'silent']);

/** Core app settings — always available (both have safe defaults). */
export const appConfigSchema = z.object({
  APP_URL: z.string().url().default(DEFAULT_APP_URL),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  /** Agent-only advanced override — builder never sets this; defaults from `NODE_ENV`. */
  LOG_LEVEL: logLevel.optional(),
});

/** An `on`/`off` env switch — the plain-language toggle a non-coder edits in `.env`. */
const onOff = z.enum(['on', 'off']);

/**
 * Coerce an env string to a positive integer, treating blank/absent as the default.
 *
 * Env values are always strings; a key left empty in a copied `.env` would otherwise
 * coerce to `0` and trip the `positive()` guard. Pre-mapping `''`/`undefined` to
 * `undefined` lets the schema default apply, so a blank line means "use the safe
 * default" rather than "fail to boot" — important when the consumer is a non-coder.
 */
const positiveIntEnv = (fallback: number) =>
  z.preprocess(
    (value) => (value === undefined || value === '' ? undefined : value),
    z.coerce.number().int().positive().default(fallback),
  );

/**
 * App-layer security — the protection every SaaS needs but a non-coder never thinks
 * to ask for, so the kit ships it **on by default** and exposes plain toggles here.
 * Read by `@vybekiit/security` (the headless engine), the web `middleware.ts`, and
 * the Cloudflare edge config in `infra/` — one source of truth, three enforcement
 * points, so a rule can never mean different things on different layers.
 *
 * - `SECURITY_RATE_LIMIT` / `_MAX` / `_WINDOW_SECONDS`: cap requests per client (by
 *   IP) to blunt brute-force and abuse on the auth + checkout routes. Default: 60
 *   requests / 60s.
 * - `SECURITY_ORIGIN_LOCK`: reject cross-site POSTs whose `Origin` isn't the app
 *   itself (basic CSRF / API-scraping defense). Same-origin always passes; the
 *   browser sends no `Origin` on top-level navigations, so pages are unaffected.
 * - `SECURITY_ALLOWED_ORIGINS`: comma-separated extra origins allowed past the lock
 *   (e.g. a separate marketing site or a mobile web build). Blank = same-origin only,
 *   the safe default. `@vybekiit/security` splits the CSV; core keeps the raw string.
 */
export const securityConfigSchema = z.object({
  SECURITY_RATE_LIMIT: onOff.default('on'),
  /** Default ceiling for routes that don't match a tier-specific override. */
  SECURITY_RATE_LIMIT_MAX: positiveIntEnv(60),
  SECURITY_RATE_LIMIT_WINDOW_SECONDS: positiveIntEnv(60),
  /** Strict tier — auth/sign-up routes (brute-force targets). Default 10/min. */
  SECURITY_RATE_LIMIT_AUTH_MAX: positiveIntEnv(10),
  /** Lenient tier — human-paced public forms (contact, waitlist). Default 30/min. */
  SECURITY_RATE_LIMIT_PUBLIC_FORM_MAX: positiveIntEnv(30),
  SECURITY_ORIGIN_LOCK: onOff.default('on'),
  SECURITY_ALLOWED_ORIGINS: z.string().default(''),
});

/**
 * Google OAuth credentials — used by `@vybekiit/auth` (better-auth social provider)
 * to power "sign in with Google". All optional because the agent provisions them for
 * the builder: the `sign-in-with-google` skill runs `gcloud` (installed by
 * `vybekiit doctor`, ADR-0001) to create the OAuth client, then writes these keys.
 * The package imports + the `doctor` skill therefore run before the values exist;
 * the adapter fails loud at first sign-in attempt while they're still blank, rather
 * than half-enabling a broken login. `GOOGLE_OAUTH_REDIRECT_URI` defaults to the
 * app's callback path so local dev needs no value.
 */
export const googleOAuthConfigSchema = z.object({
  GOOGLE_OAUTH_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().min(1).optional(),
  GOOGLE_OAUTH_REDIRECT_URI: z
    .string()
    .url('GOOGLE_OAUTH_REDIRECT_URI must be a valid URL')
    .optional(),
});

/**
 * Which payment adapter `@vybekiit/payments` constructs. A buyer runs one provider
 * at a time; the agent swaps by changing this single value. Lemon Squeezy is the
 * v1 default (Merchant of Record — it handles tax/VAT for the seller).
 */
export const paymentsConfigSchema = z.object({
  PAYMENTS_PROVIDER: z.enum(['lemon-squeezy', 'stripe', 'paypal']).default('lemon-squeezy'),
});

/** Lemon Squeezy credentials — used by `@vybekiit/payments` (lemon-squeezy adapter). */
export const lemonSqueezyConfigSchema = z.object({
  LEMONSQUEEZY_API_KEY: z.string().min(1, 'LEMONSQUEEZY_API_KEY is required'),
  LEMONSQUEEZY_STORE_ID: z.string().min(1, 'LEMONSQUEEZY_STORE_ID is required'),
  LEMONSQUEEZY_WEBHOOK_SECRET: z.string().min(1, 'LEMONSQUEEZY_WEBHOOK_SECRET is required'),
});

/** Stripe credentials — used by `@vybekiit/payments` (stripe adapter). */
export const stripeConfigSchema = z.object({
  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET is required'),
});

/**
 * PayPal credentials — used by `@vybekiit/payments` (paypal adapter).
 *
 * `PAYPAL_WEBHOOK_ID` is required because PayPal verifies webhooks server-side: the
 * adapter posts the event back to PayPal keyed by this id rather than checking a
 * local HMAC. `PAYPAL_ENV` switches between the sandbox and live API hosts.
 */
export const paypalConfigSchema = z.object({
  PAYPAL_CLIENT_ID: z.string().min(1, 'PAYPAL_CLIENT_ID is required'),
  PAYPAL_CLIENT_SECRET: z.string().min(1, 'PAYPAL_CLIENT_SECRET is required'),
  PAYPAL_WEBHOOK_ID: z.string().min(1, 'PAYPAL_WEBHOOK_ID is required'),
  PAYPAL_ENV: z.enum(['sandbox', 'live']).default('sandbox'),
});

/**
 * Which data adapter `@vybekiit/db` constructs. One backend runs at a time; the
 * agent swaps by changing this single value. Supabase (Postgres) is the default;
 * `mongodb` (Atlas) and `aws` (DynamoDB/DocumentDB) are opt-in escape hatches that
 * ship in a later step (ADR-0002). `local` is the zero-config, in-memory dev
 * fallback (ADR-0008) — never a name the builder picks: it exists in the enum so
 * an explicit `DATA_PROVIDER=local` is valid, but `resolveDataProvider` selects it
 * implicitly whenever nothing is configured, so a fresh scaffold runs with no `.env`.
 */
export const dataConfigSchema = z.object({
  DATA_PROVIDER: z
    .enum(['supabase', 'neon', 'firebase', 'mongodb', 'aws', 'local'])
    .default('supabase'),
});

/**
 * Which auth adapter `@vybekiit/auth` constructs. `better-auth` (DB-bound) is the
 * default; `cognito` is the AWS path (ADR-0003). When `better-auth` is selected,
 * the adapter follows `DATA_PROVIDER` ({@link dataConfigSchema}) to pick its
 * database binding — and AWS-data apps auto-route to Cognito, since DynamoDB has no
 * better-auth adapter. The agent's add-signin skill drives this; the builder never
 * picks a name. `local` is the zero-config dev fallback (ADR-0008): like the data
 * enum, it is selectable explicitly but is chosen implicitly by `resolveAuthProvider`
 * only when nothing is configured, so a fresh scaffold signs in as a fixed dev user.
 */
export const authConfigSchema = z.object({
  AUTH_PROVIDER: z.enum(['better-auth', 'cognito', 'local']).default('better-auth'),
});

/**
 * Which object-storage adapter `@vybekiit/db` constructs for file uploads. Supabase
 * Storage is the default; `r2` is the Cloudflare stack default once doctor provisions
 * it; `s3` is an opt-in AWS adapter (ADR-0002).
 */
export const storageConfigSchema = z.object({
  STORAGE_PROVIDER: z.enum(['supabase', 'r2', 's3']).default('supabase'),
});

/**
 * Which hosting adapter `@vybekiit/deploy` constructs at go-live. Cloudflare is the
 * default; `vercel` and `aws` (Amplify/SST) are opt-in adapters (ADR-0002/0006). The
 * agent's go-live skill drives the chosen adapter — the builder never picks.
 */
export const hostingConfigSchema = z.object({
  HOSTING_PROVIDER: z.enum(['cloudflare', 'vercel', 'aws']).default('cloudflare'),
});

/**
 * Which email adapter `@vybekiit/email` constructs. Cloudflare is the default
 * (reuses {@link cloudflareConfigSchema} creds); `ses` and `resend` are opt-in
 * adapters shipping later (ADR-0002).
 */
export const emailConfigSchema = z.object({
  EMAIL_PROVIDER: z.enum(['cloudflare', 'ses', 'resend']).default('cloudflare'),
});

/**
 * MongoDB Atlas credentials — used by `@vybekiit/db` (mongodb adapter).
 *
 * `MONGODB_URI` is the full SRV connection string Atlas hands out (it carries the
 * cluster host + user/password), so it is validated as a non-empty string rather
 * than a `url()` (Zod's url check rejects the `mongodb+srv://` scheme). `MONGODB_DB`
 * names the database the adapter opens collections against.
 */
export const mongoConfigSchema = z.object({
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  MONGODB_DB: z.string().min(1, 'MONGODB_DB is required'),
});

/**
 * AWS DynamoDB credentials — used by `@vybekiit/db` (aws adapter).
 *
 * `AWS_REGION` is required so the SDK knows which endpoint to hit. The access keys
 * are optional: when both are present the adapter passes explicit credentials,
 * otherwise it falls back to the SDK's default credential chain (instance role,
 * shared config, env vars), so a deploy on AWS infra needs no keys committed.
 * `AWS_DYNAMODB_TABLE_PREFIX` optionally namespaces table names (e.g. `prod_`).
 */
export const awsConfigSchema = z.object({
  AWS_REGION: z.string().min(1, 'AWS_REGION is required'),
  AWS_ACCESS_KEY_ID: z.string().min(1).optional(),
  AWS_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  AWS_DYNAMODB_TABLE_PREFIX: z.string().default(''),
});

/**
 * AWS Amplify Hosting target — used by `@vybekiit/deploy` (aws adapter) on top of
 * the region/credentials in {@link awsConfigSchema}.
 *
 * `AWS_AMPLIFY_APP_ID` names the Amplify app the go-live skill provisions; it is
 * optional here so the package imports + the `doctor` skill run before the app
 * exists, with the adapter failing loud at deploy time when it is still blank.
 * `AWS_AMPLIFY_BRANCH` is the Amplify branch to deploy (defaults to `main`).
 */
export const awsHostingConfigSchema = z.object({
  AWS_AMPLIFY_APP_ID: z.string().min(1).optional(),
  AWS_AMPLIFY_BRANCH: z.string().min(1).default('main'),
});

/**
 * Cloudflare R2 credentials — used by `@vybekiit/db` (r2 adapter) and
 * `@vybekiit/assets` (CDN delivery). Provisioned by `vybekiit doctor` on the default
 * Cloudflare stack. `R2_PUBLIC_URL` is the public bucket origin (custom domain or
 * r2.dev URL) used for readable object URLs and image transforms.
 */
export const r2ConfigSchema = z.object({
  R2_ACCOUNT_ID: z.string().min(1, 'R2_ACCOUNT_ID is required'),
  R2_BUCKET: z.string().min(1, 'R2_BUCKET is required'),
  R2_ACCESS_KEY_ID: z.string().min(1, 'R2_ACCESS_KEY_ID is required'),
  R2_SECRET_ACCESS_KEY: z.string().min(1, 'R2_SECRET_ACCESS_KEY is required'),
  R2_PUBLIC_URL: z.string().url('R2_PUBLIC_URL must be a valid URL'),
});

/** Supabase credentials — used by `@vybekiit/db` (supabase adapter). */
export const supabaseConfigSchema = z.object({
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required'),
  // Server-only; the browser client never sets it.
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
});

/**
 * Neon serverless Postgres — used by `@vybekiit/db` (neon adapter).
 * Reuses `DATABASE_URL` (pooled connection string from Neon dashboard).
 */
export const neonConfigSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required for Neon'),
});

/**
 * Firebase Firestore — used by `@vybekiit/db` (firebase adapter).
 * Provide inline JSON or a credentials file path (server-only).
 */
export const firebaseConfigSchema = z
  .object({
    FIREBASE_PROJECT_ID: z.string().min(1, 'FIREBASE_PROJECT_ID is required'),
    GOOGLE_APPLICATION_CREDENTIALS: z.string().min(1).optional(),
    FIREBASE_SERVICE_ACCOUNT_JSON: z.string().min(1).optional(),
  })
  .refine(
    (value) =>
      Boolean(value.FIREBASE_SERVICE_ACCOUNT_JSON) || Boolean(value.GOOGLE_APPLICATION_CREDENTIALS),
    {
      message:
        'FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS is required for Firebase',
    },
  );

/**
 * better-auth settings — used by `@vybekiit/auth` (better-auth adapter, ADR-0003).
 *
 * `BETTER_AUTH_SECRET` signs/encrypts sessions and is always required (a blank
 * secret would silently weaken every session). `BETTER_AUTH_URL` is the app's base
 * URL better-auth issues cookies/links against; it defaults to {@link DEFAULT_APP_URL}
 * so local dev needs no value. `DATABASE_URL` is the **Postgres** connection string
 * better-auth opens when `DATA_PROVIDER` is `supabase`/`postgres` — Supabase exposes
 * this in Project Settings → Database; it is optional so the package imports + the
 * `doctor` skill run before a project exists, with the adapter failing loud at first
 * use when it is still blank. The Mongo binding reads {@link mongoConfigSchema}
 * instead, so `DATABASE_URL` stays empty there.
 */
export const betterAuthConfigSchema = z.object({
  BETTER_AUTH_SECRET: z.string().min(1, 'BETTER_AUTH_SECRET is required'),
  BETTER_AUTH_URL: z.string().url('BETTER_AUTH_URL must be a valid URL').default(DEFAULT_APP_URL),
  DATABASE_URL: z.string().min(1).optional(),
});

/**
 * AWS Cognito credentials — used by `@vybekiit/auth` (cognito adapter, ADR-0003).
 *
 * `COGNITO_USER_POOL_ID` + `COGNITO_CLIENT_ID` name the user pool and its app client
 * the adapter signs up / signs in against. `AWS_REGION` is required (Cognito is
 * region-scoped) and intentionally matches the key the AWS data/S3/SES adapters use,
 * so an AWS-only app sets one region for everything. The optional access keys mirror
 * {@link awsConfigSchema}: when both are present the adapter passes explicit
 * credentials, otherwise the SDK's default credential chain applies.
 */
export const cognitoConfigSchema = z.object({
  COGNITO_USER_POOL_ID: z.string().min(1, 'COGNITO_USER_POOL_ID is required'),
  COGNITO_CLIENT_ID: z.string().min(1, 'COGNITO_CLIENT_ID is required'),
  AWS_REGION: z.string().min(1, 'AWS_REGION is required'),
  AWS_ACCESS_KEY_ID: z.string().min(1).optional(),
  AWS_SECRET_ACCESS_KEY: z.string().min(1).optional(),
});

/**
 * Cloudflare credentials — used at deploy time (`@vybekiit/deploy`) and by
 * `@vybekiit/email`.
 *
 * `CLOUDFLARE_EMAIL_ENDPOINT` is optional because Cloudflare has no general outbound
 * email API: transactional sends run from the deployed Worker/Pages context, which
 * exposes its own send route. The email adapter POSTs there; without it, `send`
 * fails loud rather than silently dropping mail.
 */
export const cloudflareConfigSchema = z.object({
  CLOUDFLARE_ACCOUNT_ID: z.string().min(1, 'CLOUDFLARE_ACCOUNT_ID is required'),
  CLOUDFLARE_API_TOKEN: z.string().min(1, 'CLOUDFLARE_API_TOKEN is required'),
  CLOUDFLARE_EMAIL_ENDPOINT: z
    .string()
    .url('CLOUDFLARE_EMAIL_ENDPOINT must be a valid URL')
    .optional(),
});

/**
 * Vercel credentials — used by `@vybekiit/deploy` (vercel adapter, ADR-0006).
 *
 * `VERCEL_TOKEN` is a personal/team token from the Vercel dashboard (Settings → Tokens).
 * `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` are optional until the go-live skill links the
 * project; when set they pin deploy scope.
 */
export const vercelConfigSchema = z.object({
  VERCEL_TOKEN: z.string().min(1, 'VERCEL_TOKEN is required'),
  VERCEL_ORG_ID: z.string().min(1).optional(),
  VERCEL_PROJECT_ID: z.string().min(1).optional(),
});

/** GitHub access automation — "the gate" that grants/revokes paid repo access. */
export const githubGateConfigSchema = z.object({
  GITHUB_GATE_TOKEN: z.string().min(1, 'GITHUB_GATE_TOKEN is required'),
  GITHUB_GATE_ORG: z.string().min(1).default('VybeKiit'),
  /** CSV of mirror repo names under {@link GITHUB_GATE_ORG} — ADR-0005 bundle invite. */
  GITHUB_GATE_REPOS: z
    .string()
    .default('web,mobile,extension')
    .transform((raw) =>
      raw
        .split(',')
        .map((name) => name.trim())
        .filter((name) => name.length > 0),
    ),
});

/**
 * The VybeKiit store's own checkout target — used by `apps/landing`'s checkout route
 * to tell the payment provider *what* is being sold. `STORE_PRODUCT_ID` is the
 * provider's purchasable id (a Lemon Squeezy *variant* id by default), passed
 * straight to {@link CheckoutParams.productId}. This is store infrastructure (the
 * id of the kit we sell), not part of a buyer's scaffolded app — a buyer's app
 * carries its own product ids instead. Required, so a misconfigured store fails
 * loud at checkout rather than creating an empty cart.
 */
export const storeConfigSchema = z.object({
  STORE_PRODUCT_ID: z.string().min(1, 'STORE_PRODUCT_ID is required'),
});

/**
 * Which observability adapter `@vybekiit/observability` constructs. `local` is the
 * no-op default (ADR-0008 pattern); `sentry` sends errors to Sentry when
 * `SENTRY_DSN` is set. The agent's track-errors skill drives this — the builder
 * never picks a name.
 */
export const observabilityConfigSchema = z.object({
  OBSERVABILITY_PROVIDER: z.enum(['sentry', 'local']).default('local'),
});

/** Sentry credentials — used by `@vybekiit/observability` (sentry adapter). */
export const sentryConfigSchema = z.object({
  SENTRY_DSN: z.string().min(1).optional(),
});

/** Which background-jobs adapter `@vybekiit/jobs` constructs. */
export const jobsConfigSchema = z.object({
  JOBS_PROVIDER: z.enum(['cloudflare', 'trigger', 'qstash', 'local']).default('cloudflare'),
});

/** Cloudflare queue/cron bindings for `@vybekiit/jobs`. */
export const cloudflareJobsConfigSchema = z.object({
  CLOUDFLARE_QUEUE_NAME: z.string().min(1).optional(),
  CLOUDFLARE_CRON_SECRET: z.string().min(1).optional(),
});

/** Which visitor-stats adapter `@vybekiit/analytics` constructs. */
export const analyticsConfigSchema = z.object({
  ANALYTICS_PROVIDER: z.enum(['plausible', 'posthog', 'local']).default('plausible'),
});

export const plausibleConfigSchema = z.object({
  PLAUSIBLE_DOMAIN: z.string().min(1, 'PLAUSIBLE_DOMAIN is required'),
  PLAUSIBLE_API_HOST: z.string().url().optional(),
});

export const posthogConfigSchema = z.object({
  POSTHOG_API_KEY: z.string().min(1, 'POSTHOG_API_KEY is required'),
  POSTHOG_HOST: z.string().url().optional(),
});

/** Which notifications adapter `@vybekiit/notifications` constructs. */
export const notificationsConfigSchema = z.object({
  NOTIFICATIONS_PROVIDER: z.enum(['expo', 'twilio', 'email', 'local']).default('expo'),
});

export const expoPushConfigSchema = z.object({
  EXPO_ACCESS_TOKEN: z.string().min(1).optional(),
});

export const twilioConfigSchema = z.object({
  TWILIO_ACCOUNT_SID: z.string().min(1, 'TWILIO_ACCOUNT_SID is required'),
  TWILIO_AUTH_TOKEN: z.string().min(1, 'TWILIO_AUTH_TOKEN is required'),
  TWILIO_FROM_NUMBER: z.string().min(1, 'TWILIO_FROM_NUMBER is required'),
});

/** Which AI runtime adapter `@vybekiit/ai` constructs. */
export const aiConfigSchema = z.object({
  AI_PROVIDER: z.enum(['openai', 'anthropic', 'openrouter', 'local']).default('openai'),
});

export const openaiConfigSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  OPENAI_MODEL: z.string().min(1).default('gpt-4o-mini'),
});

export const anthropicConfigSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),
  ANTHROPIC_MODEL: z.string().min(1).default('claude-3-5-haiku-latest'),
});

export const openrouterConfigSchema = z.object({
  OPENROUTER_API_KEY: z.string().min(1, 'OPENROUTER_API_KEY is required'),
  OPENROUTER_MODEL: z.string().min(1).default('openai/gpt-4o-mini'),
});

/** Which search adapter `@vybekiit/search` constructs. */
export const searchConfigSchema = z.object({
  SEARCH_PROVIDER: z.enum(['supabase', 'typesense', 'algolia', 'local']).default('supabase'),
});

export const typesenseConfigSchema = z.object({
  TYPESENSE_HOST: z.string().min(1, 'TYPESENSE_HOST is required'),
  TYPESENSE_API_KEY: z.string().min(1, 'TYPESENSE_API_KEY is required'),
});

export const algoliaConfigSchema = z.object({
  ALGOLIA_APP_ID: z.string().min(1, 'ALGOLIA_APP_ID is required'),
  ALGOLIA_API_KEY: z.string().min(1, 'ALGOLIA_API_KEY is required'),
  ALGOLIA_INDEX_NAME: z.string().min(1).default('default'),
});

/** Which live-update adapter `@vybekiit/realtime` constructs. */
export const realtimeConfigSchema = z.object({
  REALTIME_PROVIDER: z.enum(['supabase', 'cloudflare-do', 'local']).default('supabase'),
});

/** Which content adapter `@vybekiit/cms` constructs. */
export const cmsConfigSchema = z.object({
  CMS_PROVIDER: z.enum(['mdx', 'local']).default('mdx'),
});

export const mdxCmsConfigSchema = z.object({
  CMS_CONTENT_DIR: z.string().min(1).default('content'),
});

/** Compliance / cookie consent — `@vybekiit/compliance`. */
export const complianceConfigSchema = z.object({
  COMPLIANCE_PROVIDER: z.enum(['local']).default('local'),
  COOKIE_CONSENT_ENABLED: z.enum(['on', 'off']).default('on'),
});

/** SEO helpers — `@vybekiit/seo`. */
export const seoConfigSchema = z.object({
  SEO_PROVIDER: z.enum(['local']).default('local'),
});

/** Team workspaces — `@vybekiit/tenancy`. */
export const tenancyConfigSchema = z.object({
  TENANCY_PROVIDER: z.enum(['better-auth', 'local']).default('better-auth'),
});

/** Fast storage — `@vybekiit/kv`. */
export const kvConfigSchema = z.object({
  KV_PROVIDER: z.enum(['cloudflare', 'upstash', 'local']).default('cloudflare'),
});

export const upstashKvConfigSchema = z.object({
  UPSTASH_KV_REST_URL: z.string().url('UPSTASH_KV_REST_URL must be a valid URL'),
  UPSTASH_KV_REST_TOKEN: z.string().min(1, 'UPSTASH_KV_REST_TOKEN is required'),
});

export const cloudflareKvConfigSchema = z.object({
  CLOUDFLARE_KV_NAMESPACE_ID: z.string().min(1).optional(),
});

/** Message catalogs — `@vybekiit/i18n`. */
export const i18nConfigSchema = z.object({
  I18N_PROVIDER: z.enum(['local']).default('local'),
  DEFAULT_LOCALE: z.string().min(1).default('en'),
  MESSAGES_DIR: z.string().min(1).default('messages'),
});

/** Resend transactional email — `@vybekiit/email` (resend adapter). */
export const resendConfigSchema = z.object({
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
});

export type AppConfig = z.infer<typeof appConfigSchema>;
export type SecurityConfig = z.infer<typeof securityConfigSchema>;
export type GoogleOAuthConfig = z.infer<typeof googleOAuthConfigSchema>;
export type PaymentsConfig = z.infer<typeof paymentsConfigSchema>;
export type DataConfig = z.infer<typeof dataConfigSchema>;
export type AuthConfig = z.infer<typeof authConfigSchema>;
export type StorageConfig = z.infer<typeof storageConfigSchema>;
export type R2Config = z.infer<typeof r2ConfigSchema>;
export type HostingConfig = z.infer<typeof hostingConfigSchema>;
export type EmailConfig = z.infer<typeof emailConfigSchema>;
export type LemonSqueezyConfig = z.infer<typeof lemonSqueezyConfigSchema>;
export type StripeConfig = z.infer<typeof stripeConfigSchema>;
export type PaypalConfig = z.infer<typeof paypalConfigSchema>;
export type MongoConfig = z.infer<typeof mongoConfigSchema>;
export type AwsConfig = z.infer<typeof awsConfigSchema>;
export type AwsHostingConfig = z.infer<typeof awsHostingConfigSchema>;
export type SupabaseConfig = z.infer<typeof supabaseConfigSchema>;
export type NeonConfig = z.infer<typeof neonConfigSchema>;
export type FirebaseConfig = z.infer<typeof firebaseConfigSchema>;
export type BetterAuthConfig = z.infer<typeof betterAuthConfigSchema>;
export type CognitoConfig = z.infer<typeof cognitoConfigSchema>;
export type CloudflareConfig = z.infer<typeof cloudflareConfigSchema>;
export type VercelConfig = z.infer<typeof vercelConfigSchema>;
export type GithubGateConfig = z.infer<typeof githubGateConfigSchema>;
export type StoreConfig = z.infer<typeof storeConfigSchema>;
export type ObservabilityConfig = z.infer<typeof observabilityConfigSchema>;
export type SentryConfig = z.infer<typeof sentryConfigSchema>;
export type JobsConfig = z.infer<typeof jobsConfigSchema>;
export type CloudflareJobsConfig = z.infer<typeof cloudflareJobsConfigSchema>;
export type AnalyticsConfig = z.infer<typeof analyticsConfigSchema>;
export type PlausibleConfig = z.infer<typeof plausibleConfigSchema>;
export type PosthogConfig = z.infer<typeof posthogConfigSchema>;
export type NotificationsConfig = z.infer<typeof notificationsConfigSchema>;
export type ExpoPushConfig = z.infer<typeof expoPushConfigSchema>;
export type TwilioConfig = z.infer<typeof twilioConfigSchema>;
export type AiConfig = z.infer<typeof aiConfigSchema>;
export type OpenaiConfig = z.infer<typeof openaiConfigSchema>;
export type AnthropicConfig = z.infer<typeof anthropicConfigSchema>;
export type OpenrouterConfig = z.infer<typeof openrouterConfigSchema>;
export type SearchConfig = z.infer<typeof searchConfigSchema>;
export type TypesenseConfig = z.infer<typeof typesenseConfigSchema>;
export type AlgoliaConfig = z.infer<typeof algoliaConfigSchema>;
export type RealtimeConfig = z.infer<typeof realtimeConfigSchema>;
export type CmsConfig = z.infer<typeof cmsConfigSchema>;
export type MdxCmsConfig = z.infer<typeof mdxCmsConfigSchema>;
export type ComplianceConfig = z.infer<typeof complianceConfigSchema>;
export type SeoConfig = z.infer<typeof seoConfigSchema>;
export type TenancyConfig = z.infer<typeof tenancyConfigSchema>;
export type KvConfig = z.infer<typeof kvConfigSchema>;
export type UpstashKvConfig = z.infer<typeof upstashKvConfigSchema>;
export type CloudflareKvConfig = z.infer<typeof cloudflareKvConfigSchema>;
export type I18nConfig = z.infer<typeof i18nConfigSchema>;
export type ResendConfig = z.infer<typeof resendConfigSchema>;

/**
 * Parse + validate one config slice from the environment, failing loud.
 *
 * On invalid/missing keys it throws a single error listing every offending key —
 * a misconfigured deploy should crash at startup with an actionable message, not
 * limp along and surface a confusing failure deep in a request (the `doctor`
 * skill relies on this clarity to translate the problem for a non-coder).
 *
 * Returns the schema's *output* type, so fields with `.default(...)` are
 * non-optional for callers (the env may omit them; the parsed result never does).
 *
 * @param schema - one of the per-concern schemas in this module
 * @param env - environment source (defaults to `process.env`)
 */
export function parseEnv<S extends z.ZodTypeAny>(
  schema: S,
  env: EnvSource = process.env,
): z.infer<S> {
  const parsed = schema.safeParse(env);
  if (parsed.success) return parsed.data;

  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  throw new Error(`Invalid VybeKiit configuration:\n${issues}`);
}
