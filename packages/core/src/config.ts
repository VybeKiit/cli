import { Schema } from 'effect';
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
 *
 * Validation is Effect `Schema` end-to-end (ADR-0023). `core` keeps the shared
 * primitives + the {@link parseEnv} engine; provider packages own their own slices.
 */

/** A readable view of `process.env` that doesn't require `@types/node` here. */
type EnvSource = Record<string, string | undefined>;

/** A required, non-empty env string. */
const NonEmpty = Schema.String.pipe(Schema.minLength(1));

/** A string that parses as a URL — the Schema equivalent of the old zod `.url()`. */
const UrlString = Schema.String.pipe(
  Schema.filter((value) => URL.canParse(value), { message: () => 'must be a valid URL' }),
);

/** A string shaped like an email address — the Schema equivalent of zod `.email()`. */
const EmailString = Schema.String.pipe(
  Schema.filter((value) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value), {
    message: () => 'must be a valid email',
  }),
);

/** Minimum log level — optional override; `resolveDefaultLogLevel` applies when absent. */
const logLevel = Schema.Literal('debug', 'info', 'warn', 'error', 'silent');

/** An `on`/`off` env switch — the plain-language toggle a non-coder edits in `.env`. */
export const onOff = Schema.Literal('on', 'off');

/**
 * Coerce an env string to a positive integer, treating blank/absent as the default.
 *
 * Env values are always strings; a key left empty in a copied `.env` would otherwise
 * coerce to `0` and trip the `positive` guard. Mapping `''` to the default (and absent
 * to the `optionalWith` default) means a blank line means "use the safe default"
 * rather than "fail to boot" — important when the consumer is a non-coder.
 */
export const positiveIntEnv = (fallback: number) =>
  Schema.optionalWith(
    Schema.transform(Schema.String, Schema.Number, {
      strict: true,
      decode: (value) => (value === '' ? fallback : Number(value)),
      encode: (value) => String(value),
    }).pipe(Schema.int(), Schema.positive()),
    { default: () => fallback },
  );

/** An optional `0/1/true/false` env flag → boolean (absent → omitted). */
const optionalBoolEnv = Schema.optional(
  Schema.transform(Schema.Literal('0', '1', 'true', 'false', ''), Schema.Boolean, {
    strict: true,
    decode: (raw) => raw === '1' || raw === 'true',
    encode: (value) => (value ? '1' : '0'),
  }),
);

/** Core app settings — always available (both have safe defaults). */
export const appConfigSchema = Schema.Struct({
  APP_URL: Schema.optionalWith(UrlString, { default: () => DEFAULT_APP_URL }),
  NODE_ENV: Schema.optionalWith(Schema.Literal('development', 'production'), {
    default: () => 'development' as const,
  }),
  /** Agent-only advanced override — builder never sets this; defaults from `NODE_ENV`. */
  LOG_LEVEL: Schema.optional(logLevel),
});

/**
 * Secure-by-default app-layer limits (rate limit, origin lock) — shipped on so a
 * non-coder never has to ask for them. Read by `@vybekiit/core/security`, the web
 * `middleware.ts`, and the Cloudflare edge config: one source, three enforcement
 * points. Rationale + threat model: ADR-0009.
 */
export const securityConfigSchema = Schema.Struct({
  SECURITY_RATE_LIMIT: Schema.optionalWith(onOff, { default: () => 'on' as const }),
  /** Default ceiling for routes that don't match a tier-specific override. */
  SECURITY_RATE_LIMIT_MAX: positiveIntEnv(60),
  SECURITY_RATE_LIMIT_WINDOW_SECONDS: positiveIntEnv(60),
  /** Strict tier — auth/sign-up routes (brute-force targets). Default 10/min. */
  SECURITY_RATE_LIMIT_AUTH_MAX: positiveIntEnv(10),
  /** Lenient tier — human-paced public forms (contact, waitlist). Default 30/min. */
  SECURITY_RATE_LIMIT_PUBLIC_FORM_MAX: positiveIntEnv(30),
  SECURITY_ORIGIN_LOCK: Schema.optionalWith(onOff, { default: () => 'on' as const }),
  SECURITY_ALLOWED_ORIGINS: Schema.optionalWith(Schema.String, { default: () => '' }),
});

/**
 * Google OAuth credentials — used by `@vybekiit/auth` for "sign in with Google". All
 * optional because the agent provisions them for the builder (the `sign-in-with-google`
 * skill runs `gcloud`), so imports run before the values exist; the adapter fails loud
 * at first sign-in while blank. Rationale: ADR-0001.
 */
export const googleOAuthConfigSchema = Schema.Struct({
  GOOGLE_OAUTH_CLIENT_ID: Schema.optional(NonEmpty),
  GOOGLE_OAUTH_CLIENT_SECRET: Schema.optional(NonEmpty),
  GOOGLE_OAUTH_REDIRECT_URI: Schema.optional(UrlString),
});

/**
 * Which payment adapter `@vybekiit/payments` constructs. A buyer runs one provider
 * at a time; the agent swaps by changing this single value. Lemon Squeezy is the
 * v1 default (Merchant of Record — it handles tax/VAT for the seller).
 */
export const paymentsConfigSchema = Schema.Struct({
  PAYMENTS_PROVIDER: Schema.optionalWith(Schema.Literal('lemon-squeezy', 'stripe', 'paypal'), {
    default: () => 'lemon-squeezy' as const,
  }),
});

/** Lemon Squeezy credentials — used by `@vybekiit/payments` (lemon-squeezy adapter). */
export const lemonSqueezyConfigSchema = Schema.Struct({
  LEMONSQUEEZY_API_KEY: NonEmpty,
  LEMONSQUEEZY_STORE_ID: NonEmpty,
  LEMONSQUEEZY_WEBHOOK_SECRET: NonEmpty,
  LEMONSQUEEZY_TEST_MODE: Schema.optionalWith(
    Schema.transform(Schema.Literal('true', 'false'), Schema.Boolean, {
      strict: true,
      decode: (value) => value === 'true',
      encode: (value) => (value ? 'true' : 'false'),
    }),
    { default: () => false },
  ),
});

/** Stripe credentials — used by `@vybekiit/payments` (stripe adapter). */
export const stripeConfigSchema = Schema.Struct({
  STRIPE_SECRET_KEY: NonEmpty,
  STRIPE_WEBHOOK_SECRET: NonEmpty,
});

/**
 * PayPal credentials — used by `@vybekiit/payments` (paypal adapter). `PAYPAL_WEBHOOK_ID`
 * is required because PayPal verifies webhooks server-side; `PAYPAL_ENV` switches between
 * the sandbox and live API hosts.
 */
export const paypalConfigSchema = Schema.Struct({
  PAYPAL_CLIENT_ID: NonEmpty,
  PAYPAL_CLIENT_SECRET: NonEmpty,
  PAYPAL_WEBHOOK_ID: NonEmpty,
  PAYPAL_ENV: Schema.optionalWith(Schema.Literal('sandbox', 'live'), {
    default: () => 'sandbox' as const,
  }),
});

/**
 * Which data adapter `@vybekiit/db` constructs. One backend runs at a time; the agent
 * swaps by changing this value. Supabase (Postgres) is the default; `local` is the
 * zero-config in-memory dev fallback selected implicitly when nothing is configured
 * (ADR-0008). Rationale: ADR-0002.
 */
export const dataConfigSchema = Schema.Struct({
  DATA_PROVIDER: Schema.optionalWith(
    Schema.Literal('supabase', 'neon', 'firebase', 'mongodb', 'aws', 'local', 'railway'),
    { default: () => 'supabase' as const },
  ),
});

/**
 * Which auth adapter `@vybekiit/auth` constructs. `supabase` (Supabase Auth) is the
 * default for the default Supabase stack; `better-auth` binds to a non-Supabase
 * Postgres/Mongo; `cognito` is the AWS path; `local` is the zero-config dev fallback
 * (ADR-0008). When unset, auth follows `DATA_PROVIDER`. Rationale: ADR-0003.
 */
export const authConfigSchema = Schema.Struct({
  AUTH_PROVIDER: Schema.optional(Schema.Literal('supabase', 'better-auth', 'cognito', 'local')),
});

/**
 * Which object-storage adapter `@vybekiit/db` constructs for file uploads. Supabase
 * Storage is the default; `r2` is the Cloudflare stack default; `s3` is opt-in AWS.
 */
export const storageConfigSchema = Schema.Struct({
  STORAGE_PROVIDER: Schema.optionalWith(Schema.Literal('supabase', 'r2', 's3'), {
    default: () => 'supabase' as const,
  }),
});

/**
 * Which hosting adapter `@vybekiit/deploy` constructs at go-live. Cloudflare is the
 * default; `vercel` and `aws` are opt-in (ADR-0002/0006). The go-live skill drives it.
 */
export const hostingConfigSchema = Schema.Struct({
  HOSTING_PROVIDER: Schema.optionalWith(Schema.Literal('cloudflare', 'vercel', 'aws', 'railway'), {
    default: () => 'cloudflare' as const,
  }),
});

/**
 * Which email adapter the templates' email delivery constructs. Cloudflare is the default
 * (reuses {@link cloudflareConfigSchema} creds); `ses` and `resend` are opt-in (ADR-0002).
 */
export const emailConfigSchema = Schema.Struct({
  EMAIL_PROVIDER: Schema.optionalWith(Schema.Literal('cloudflare', 'ses', 'resend'), {
    default: () => 'cloudflare' as const,
  }),
});

/**
 * MongoDB Atlas credentials — used by `@vybekiit/db` (mongodb adapter). `MONGODB_URI`
 * is the full SRV connection string (validated as non-empty, since the `mongodb+srv://`
 * scheme fails a strict URL check); `MONGODB_DB` names the database opened.
 */
export const mongoConfigSchema = Schema.Struct({
  MONGODB_URI: NonEmpty,
  MONGODB_DB: NonEmpty,
});

/**
 * AWS DynamoDB credentials — used by `@vybekiit/db` (aws adapter). `AWS_REGION` is
 * required; the access keys are optional (SDK default credential chain applies when
 * absent). `AWS_DYNAMODB_TABLE_PREFIX` optionally namespaces table names.
 */
export const awsConfigSchema = Schema.Struct({
  AWS_REGION: NonEmpty,
  AWS_ACCESS_KEY_ID: Schema.optional(NonEmpty),
  AWS_SECRET_ACCESS_KEY: Schema.optional(NonEmpty),
  AWS_DYNAMODB_TABLE_PREFIX: Schema.optionalWith(Schema.String, { default: () => '' }),
});

/**
 * AWS Amplify Hosting target — used by `@vybekiit/deploy` (aws adapter) on top of the
 * region/credentials in {@link awsConfigSchema}. `AWS_AMPLIFY_APP_ID` is optional until
 * the go-live skill provisions it; `AWS_AMPLIFY_BRANCH` defaults to `main`.
 */
export const awsHostingConfigSchema = Schema.Struct({
  AWS_AMPLIFY_APP_ID: Schema.optional(NonEmpty),
  AWS_AMPLIFY_BRANCH: Schema.optionalWith(NonEmpty, { default: () => 'main' }),
});

/**
 * Cloudflare R2 credentials — used by `@vybekiit/db` (r2 adapter) and the templates'
 * asset delivery (CDN). `R2_PUBLIC_URL` is the public bucket origin for readable object URLs.
 */
export const r2ConfigSchema = Schema.Struct({
  R2_ACCOUNT_ID: NonEmpty,
  R2_BUCKET: NonEmpty,
  R2_ACCESS_KEY_ID: NonEmpty,
  R2_SECRET_ACCESS_KEY: NonEmpty,
  R2_PUBLIC_URL: UrlString,
});

/** Supabase credentials — used by `@vybekiit/db` (supabase adapter) and Supabase Auth. */
export const supabaseConfigSchema = Schema.Struct({
  SUPABASE_URL: UrlString,
  SUPABASE_ANON_KEY: NonEmpty,
  // Server-only; the browser client never sets it.
  SUPABASE_SERVICE_ROLE_KEY: Schema.optional(NonEmpty),
});

/**
 * Neon serverless Postgres — used by `@vybekiit/db` (neon adapter).
 * Reuses `DATABASE_URL` (pooled connection string from Neon dashboard).
 */
export const neonConfigSchema = Schema.Struct({
  DATABASE_URL: NonEmpty,
});

/**
 * Railway Postgres — used by `@vybekiit/db` (railway adapter, ADR-0017).
 * `DATABASE_URL` is the Postgres connection string from Railway service variables.
 */
export const railwayConfigSchema = Schema.Struct({
  DATABASE_URL: NonEmpty,
});

/**
 * Railway hosting — used by `@vybekiit/deploy` (railway adapter, ADR-0017).
 * Auth is CLI-native (`railway login`); project/service ids are optional until link.
 */
export const railwayHostingConfigSchema = Schema.Struct({
  RAILWAY_PROJECT_ID: Schema.optional(NonEmpty),
  RAILWAY_SERVICE_ID: Schema.optional(NonEmpty),
});

/**
 * Firebase Firestore — used by `@vybekiit/db` (firebase adapter).
 * Provide inline JSON or a credentials file path (server-only); one is required.
 */
export const firebaseConfigSchema = Schema.Struct({
  FIREBASE_PROJECT_ID: NonEmpty,
  GOOGLE_APPLICATION_CREDENTIALS: Schema.optional(NonEmpty),
  FIREBASE_SERVICE_ACCOUNT_JSON: Schema.optional(NonEmpty),
}).pipe(
  Schema.filter((value) =>
    value.FIREBASE_SERVICE_ACCOUNT_JSON || value.GOOGLE_APPLICATION_CREDENTIALS
      ? true
      : 'FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS is required for Firebase',
  ),
);

/**
 * better-auth settings — used by `@vybekiit/auth` (better-auth adapter, ADR-0003).
 * `BETTER_AUTH_SECRET` signs sessions (always required); `BETTER_AUTH_URL` defaults to
 * {@link DEFAULT_APP_URL}; `DATABASE_URL` is the Postgres binding (optional so imports
 * run before a project exists; the adapter fails loud at first use when blank).
 */
export const betterAuthConfigSchema = Schema.Struct({
  BETTER_AUTH_SECRET: NonEmpty,
  BETTER_AUTH_URL: Schema.optionalWith(UrlString, { default: () => DEFAULT_APP_URL }),
  DATABASE_URL: Schema.optional(NonEmpty),
});

/**
 * AWS Cognito credentials — used by `@vybekiit/auth` (cognito adapter, ADR-0003).
 * `AWS_REGION` is required (Cognito is region-scoped) and matches the AWS data/S3/SES
 * key. The optional access keys mirror {@link awsConfigSchema}.
 */
export const cognitoConfigSchema = Schema.Struct({
  COGNITO_USER_POOL_ID: NonEmpty,
  COGNITO_CLIENT_ID: NonEmpty,
  AWS_REGION: NonEmpty,
  AWS_ACCESS_KEY_ID: Schema.optional(NonEmpty),
  AWS_SECRET_ACCESS_KEY: Schema.optional(NonEmpty),
});

/**
 * Cloudflare credentials — used at deploy time (`@vybekiit/deploy`) and by the templates'
 * email delivery. `CLOUDFLARE_EMAIL_ENDPOINT` is optional (transactional sends run
 * from the deployed Worker/Pages context, which exposes its own send route).
 */
export const cloudflareConfigSchema = Schema.Struct({
  CLOUDFLARE_ACCOUNT_ID: NonEmpty,
  CLOUDFLARE_API_TOKEN: NonEmpty,
  CLOUDFLARE_EMAIL_ENDPOINT: Schema.optional(UrlString),
});

/**
 * Cloudflare email worker credentials — used by the templates' cloudflare email adapter.
 * Separate from deploy creds so sending does not require a full CF API token at runtime.
 */
export const cloudflareEmailConfigSchema = Schema.Struct({
  EMAIL_WORKER_SECRET: NonEmpty,
  CLOUDFLARE_EMAIL_ENDPOINT: UrlString,
  EMAIL_FROM: Schema.optional(EmailString),
  EMAIL_FROM_NAME: Schema.optional(NonEmpty),
});

/**
 * Namecheap registrar API — optional; used by `@vybekiit/deploy` and `vybekiit doctor`
 * to automate nameserver delegation. All three core keys must be set together.
 */
export const namecheapConfigSchema = Schema.Struct({
  NAMECHEAP_API_USER: Schema.optional(NonEmpty),
  NAMECHEAP_API_KEY: Schema.optional(NonEmpty),
  NAMECHEAP_CLIENT_IP: Schema.optional(NonEmpty),
  NAMECHEAP_USERNAME: Schema.optional(NonEmpty),
  NAMECHEAP_SANDBOX: optionalBoolEnv,
}).pipe(
  Schema.filter((value) =>
    allOrNone(value, ['NAMECHEAP_API_USER', 'NAMECHEAP_API_KEY', 'NAMECHEAP_CLIENT_IP']),
  ),
);

/**
 * GoDaddy registrar API — optional; used by `@vybekiit/deploy` and `vybekiit doctor`
 * to automate nameserver delegation. Both core keys must be set together.
 */
export const godaddyConfigSchema = Schema.Struct({
  GODADDY_API_KEY: Schema.optional(NonEmpty),
  GODADDY_API_SECRET: Schema.optional(NonEmpty),
  GODADDY_OTE: optionalBoolEnv,
}).pipe(Schema.filter((value) => allOrNone(value, ['GODADDY_API_KEY', 'GODADDY_API_SECRET'])));

/**
 * Enforce an all-or-none group of required keys: pass when none or all are present,
 * else fail with the first missing key named (so the message is actionable + greppable).
 */
function allOrNone<K extends string>(
  value: Partial<Record<K, unknown>>,
  keys: readonly K[],
): true | string {
  const present = keys.filter((key) => Boolean(value[key]));
  if (present.length === 0 || present.length === keys.length) return true;
  const missing = keys.find((key) => !value[key]);
  return `${missing} is required when any related registrar var is set`;
}

/**
 * Vercel credentials — used by `@vybekiit/deploy` (vercel adapter, ADR-0006).
 * `VERCEL_ORG_ID`/`VERCEL_PROJECT_ID` are optional until the go-live skill links.
 */
export const vercelConfigSchema = Schema.Struct({
  VERCEL_TOKEN: NonEmpty,
  VERCEL_ORG_ID: Schema.optional(NonEmpty),
  VERCEL_PROJECT_ID: Schema.optional(NonEmpty),
});

/** GitHub access automation — "the gate" that grants/revokes paid repo access. */
export const githubGateConfigSchema = Schema.Struct({
  GITHUB_GATE_TOKEN: NonEmpty,
  GITHUB_GATE_ORG: Schema.optionalWith(NonEmpty, { default: () => 'VybeKiit' }),
  /** CSV of mirror repo names under `GITHUB_GATE_ORG` — ADR-0005 bundle invite. */
  GITHUB_GATE_REPOS: Schema.optionalWith(
    Schema.transform(Schema.String, Schema.Array(Schema.String), {
      strict: true,
      decode: (raw) =>
        raw
          .split(',')
          .map((name) => name.trim())
          .filter((name) => name.length > 0),
      encode: (repos) => repos.join(','),
    }),
    { default: () => ['web', 'mobile', 'extension'] as readonly string[] },
  ),
});

/**
 * The VybeKiit store's own checkout target — used by `apps/landing`'s checkout route to
 * tell the payment provider *what* is being sold. Required, so a misconfigured store
 * fails loud at checkout rather than creating an empty cart.
 */
export const storeConfigSchema = Schema.Struct({
  STORE_PRODUCT_ID: NonEmpty,
});

/**
 * Which observability adapter `@vybekiit/core/observability` constructs. `local` is the
 * no-op default; `sentry` sends errors when `SENTRY_DSN` is set (track-errors skill).
 */
export const observabilityConfigSchema = Schema.Struct({
  OBSERVABILITY_PROVIDER: Schema.optionalWith(Schema.Literal('sentry', 'local'), {
    default: () => 'local' as const,
  }),
});

/** Sentry credentials — used by `@vybekiit/core/observability` (sentry adapter). */
export const sentryConfigSchema = Schema.Struct({
  SENTRY_DSN: Schema.optional(NonEmpty),
});

/** Which background-jobs adapter `@vybekiit/jobs` constructs. */
export const jobsConfigSchema = Schema.Struct({
  JOBS_PROVIDER: Schema.optionalWith(Schema.Literal('cloudflare', 'trigger', 'qstash', 'local'), {
    default: () => 'cloudflare' as const,
  }),
});

/** Cloudflare queue/cron bindings for `@vybekiit/jobs`. */
export const cloudflareJobsConfigSchema = Schema.Struct({
  CLOUDFLARE_QUEUE_NAME: Schema.optional(NonEmpty),
  CLOUDFLARE_CRON_SECRET: Schema.optional(NonEmpty),
});

/** Which visitor-stats adapter `@vybekiit/analytics` constructs. */
export const analyticsConfigSchema = Schema.Struct({
  ANALYTICS_PROVIDER: Schema.optionalWith(Schema.Literal('plausible', 'posthog', 'local'), {
    default: () => 'plausible' as const,
  }),
});

export const plausibleConfigSchema = Schema.Struct({
  PLAUSIBLE_DOMAIN: NonEmpty,
  PLAUSIBLE_API_HOST: Schema.optional(UrlString),
});

export const posthogConfigSchema = Schema.Struct({
  POSTHOG_API_KEY: NonEmpty,
  POSTHOG_HOST: Schema.optional(UrlString),
});

/** Which notifications adapter the templates' notifications delivery constructs. */
export const notificationsConfigSchema = Schema.Struct({
  NOTIFICATIONS_PROVIDER: Schema.optionalWith(Schema.Literal('expo', 'twilio', 'email', 'local'), {
    default: () => 'expo' as const,
  }),
});

export const expoPushConfigSchema = Schema.Struct({
  EXPO_ACCESS_TOKEN: Schema.optional(NonEmpty),
});

export const twilioConfigSchema = Schema.Struct({
  TWILIO_ACCOUNT_SID: NonEmpty,
  TWILIO_AUTH_TOKEN: NonEmpty,
  TWILIO_FROM_NUMBER: NonEmpty,
  TWILIO_WHATSAPP_FROM: Schema.optional(NonEmpty),
  TWILIO_VERIFY_SERVICE_SID: Schema.optional(NonEmpty),
});

/** Which AI runtime adapter `@vybekiit/ai` constructs. */
export const aiConfigSchema = Schema.Struct({
  AI_PROVIDER: Schema.optionalWith(Schema.Literal('openai', 'anthropic', 'openrouter', 'local'), {
    default: () => 'openai' as const,
  }),
});

export const openaiConfigSchema = Schema.Struct({
  OPENAI_API_KEY: NonEmpty,
  OPENAI_MODEL: Schema.optionalWith(NonEmpty, { default: () => 'gpt-4o-mini' }),
});

export const anthropicConfigSchema = Schema.Struct({
  ANTHROPIC_API_KEY: NonEmpty,
  ANTHROPIC_MODEL: Schema.optionalWith(NonEmpty, { default: () => 'claude-3-5-haiku-latest' }),
});

export const openrouterConfigSchema = Schema.Struct({
  OPENROUTER_API_KEY: NonEmpty,
  OPENROUTER_MODEL: Schema.optionalWith(NonEmpty, { default: () => 'openai/gpt-4o-mini' }),
});

/** Which search adapter `@vybekiit/search` constructs. */
export const searchConfigSchema = Schema.Struct({
  SEARCH_PROVIDER: Schema.optionalWith(
    Schema.Literal('supabase', 'typesense', 'algolia', 'local'),
    { default: () => 'supabase' as const },
  ),
});

export const typesenseConfigSchema = Schema.Struct({
  TYPESENSE_HOST: NonEmpty,
  TYPESENSE_API_KEY: NonEmpty,
});

export const algoliaConfigSchema = Schema.Struct({
  ALGOLIA_APP_ID: NonEmpty,
  ALGOLIA_API_KEY: NonEmpty,
  ALGOLIA_INDEX_NAME: Schema.optionalWith(NonEmpty, { default: () => 'default' }),
});

/** Which live-update adapter `@vybekiit/realtime` constructs. */
export const realtimeConfigSchema = Schema.Struct({
  REALTIME_PROVIDER: Schema.optionalWith(Schema.Literal('supabase', 'cloudflare-do', 'local'), {
    default: () => 'supabase' as const,
  }),
});

/** Which content adapter `@vybekiit/cms` constructs. */
export const cmsConfigSchema = Schema.Struct({
  CMS_PROVIDER: Schema.optionalWith(Schema.Literal('mdx', 'local'), {
    default: () => 'mdx' as const,
  }),
});

export const mdxCmsConfigSchema = Schema.Struct({
  CMS_CONTENT_DIR: Schema.optionalWith(NonEmpty, { default: () => 'content' }),
});

/** Compliance / cookie consent — `@vybekiit/compliance`. */
export const complianceConfigSchema = Schema.Struct({
  COMPLIANCE_PROVIDER: Schema.optionalWith(Schema.Literal('local'), {
    default: () => 'local' as const,
  }),
  COOKIE_CONSENT_ENABLED: Schema.optionalWith(onOff, { default: () => 'on' as const }),
});

/** SEO helpers — `@vybekiit/seo`. */
export const seoConfigSchema = Schema.Struct({
  SEO_PROVIDER: Schema.optionalWith(Schema.Literal('local'), { default: () => 'local' as const }),
});

/** Team workspaces — `@vybekiit/tenancy`. */
export const tenancyConfigSchema = Schema.Struct({
  TENANCY_PROVIDER: Schema.optionalWith(Schema.Literal('better-auth', 'local'), {
    default: () => 'better-auth' as const,
  }),
});

/** Fast storage — `@vybekiit/kv`. */
export const kvConfigSchema = Schema.Struct({
  KV_PROVIDER: Schema.optionalWith(Schema.Literal('cloudflare', 'upstash', 'local'), {
    default: () => 'cloudflare' as const,
  }),
});

/** Client-side cache + UI prefs — `@vybekiit/client-state`. */
export const clientStateConfigSchema = Schema.Struct({
  CLIENT_STATE_PERSIST: Schema.optionalWith(onOff, { default: () => 'on' as const }),
  CLIENT_STATE_QUERY_STALE_SECONDS: positiveIntEnv(60),
});

export const upstashKvConfigSchema = Schema.Struct({
  UPSTASH_KV_REST_URL: UrlString,
  UPSTASH_KV_REST_TOKEN: NonEmpty,
});

export const cloudflareKvConfigSchema = Schema.Struct({
  CLOUDFLARE_KV_NAMESPACE_ID: Schema.optional(NonEmpty),
});

/** Message catalogs — `@vybekiit/i18n`. */
export const i18nConfigSchema = Schema.Struct({
  I18N_PROVIDER: Schema.optionalWith(Schema.Literal('local'), { default: () => 'local' as const }),
  DEFAULT_LOCALE: Schema.optionalWith(NonEmpty, { default: () => 'en' }),
  MESSAGES_DIR: Schema.optionalWith(NonEmpty, { default: () => 'messages' }),
});

/** Resend transactional email — the templates' resend email adapter. */
export const resendConfigSchema = Schema.Struct({
  RESEND_API_KEY: NonEmpty,
});

export type AppConfig = Schema.Schema.Type<typeof appConfigSchema>;
export type SecurityConfig = Schema.Schema.Type<typeof securityConfigSchema>;
export type GoogleOAuthConfig = Schema.Schema.Type<typeof googleOAuthConfigSchema>;
export type PaymentsConfig = Schema.Schema.Type<typeof paymentsConfigSchema>;
export type DataConfig = Schema.Schema.Type<typeof dataConfigSchema>;
export type AuthConfig = Schema.Schema.Type<typeof authConfigSchema>;
export type StorageConfig = Schema.Schema.Type<typeof storageConfigSchema>;
export type R2Config = Schema.Schema.Type<typeof r2ConfigSchema>;
export type HostingConfig = Schema.Schema.Type<typeof hostingConfigSchema>;
export type EmailConfig = Schema.Schema.Type<typeof emailConfigSchema>;
export type LemonSqueezyConfig = Schema.Schema.Type<typeof lemonSqueezyConfigSchema>;
export type StripeConfig = Schema.Schema.Type<typeof stripeConfigSchema>;
export type PaypalConfig = Schema.Schema.Type<typeof paypalConfigSchema>;
export type MongoConfig = Schema.Schema.Type<typeof mongoConfigSchema>;
export type AwsConfig = Schema.Schema.Type<typeof awsConfigSchema>;
export type AwsHostingConfig = Schema.Schema.Type<typeof awsHostingConfigSchema>;
export type SupabaseConfig = Schema.Schema.Type<typeof supabaseConfigSchema>;
export type NeonConfig = Schema.Schema.Type<typeof neonConfigSchema>;
export type RailwayConfig = Schema.Schema.Type<typeof railwayConfigSchema>;
export type RailwayHostingConfig = Schema.Schema.Type<typeof railwayHostingConfigSchema>;
export type FirebaseConfig = Schema.Schema.Type<typeof firebaseConfigSchema>;
export type BetterAuthConfig = Schema.Schema.Type<typeof betterAuthConfigSchema>;
export type CognitoConfig = Schema.Schema.Type<typeof cognitoConfigSchema>;
export type CloudflareConfig = Schema.Schema.Type<typeof cloudflareConfigSchema>;
export type CloudflareEmailConfig = Schema.Schema.Type<typeof cloudflareEmailConfigSchema>;
export type NamecheapConfig = Schema.Schema.Type<typeof namecheapConfigSchema>;
export type GodaddyConfig = Schema.Schema.Type<typeof godaddyConfigSchema>;
export type VercelConfig = Schema.Schema.Type<typeof vercelConfigSchema>;
export type GithubGateConfig = Schema.Schema.Type<typeof githubGateConfigSchema>;
export type StoreConfig = Schema.Schema.Type<typeof storeConfigSchema>;
export type ObservabilityConfig = Schema.Schema.Type<typeof observabilityConfigSchema>;
export type SentryConfig = Schema.Schema.Type<typeof sentryConfigSchema>;
export type JobsConfig = Schema.Schema.Type<typeof jobsConfigSchema>;
export type CloudflareJobsConfig = Schema.Schema.Type<typeof cloudflareJobsConfigSchema>;
export type AnalyticsConfig = Schema.Schema.Type<typeof analyticsConfigSchema>;
export type PlausibleConfig = Schema.Schema.Type<typeof plausibleConfigSchema>;
export type PosthogConfig = Schema.Schema.Type<typeof posthogConfigSchema>;
export type NotificationsConfig = Schema.Schema.Type<typeof notificationsConfigSchema>;
export type ExpoPushConfig = Schema.Schema.Type<typeof expoPushConfigSchema>;
export type TwilioConfig = Schema.Schema.Type<typeof twilioConfigSchema>;
export type AiConfig = Schema.Schema.Type<typeof aiConfigSchema>;
export type OpenaiConfig = Schema.Schema.Type<typeof openaiConfigSchema>;
export type AnthropicConfig = Schema.Schema.Type<typeof anthropicConfigSchema>;
export type OpenrouterConfig = Schema.Schema.Type<typeof openrouterConfigSchema>;
export type SearchConfig = Schema.Schema.Type<typeof searchConfigSchema>;
export type TypesenseConfig = Schema.Schema.Type<typeof typesenseConfigSchema>;
export type AlgoliaConfig = Schema.Schema.Type<typeof algoliaConfigSchema>;
export type RealtimeConfig = Schema.Schema.Type<typeof realtimeConfigSchema>;
export type CmsConfig = Schema.Schema.Type<typeof cmsConfigSchema>;
export type MdxCmsConfig = Schema.Schema.Type<typeof mdxCmsConfigSchema>;
export type ComplianceConfig = Schema.Schema.Type<typeof complianceConfigSchema>;
export type SeoConfig = Schema.Schema.Type<typeof seoConfigSchema>;
export type TenancyConfig = Schema.Schema.Type<typeof tenancyConfigSchema>;
export type KvConfig = Schema.Schema.Type<typeof kvConfigSchema>;
export type ClientStateConfig = Schema.Schema.Type<typeof clientStateConfigSchema>;
export type UpstashKvConfig = Schema.Schema.Type<typeof upstashKvConfigSchema>;
export type CloudflareKvConfig = Schema.Schema.Type<typeof cloudflareKvConfigSchema>;
export type I18nConfig = Schema.Schema.Type<typeof i18nConfigSchema>;
export type ResendConfig = Schema.Schema.Type<typeof resendConfigSchema>;

/**
 * Parse + validate one config slice from the environment, failing loud with a single
 * actionable message (ADR-0023). `errors: 'all'` accumulates every missing/invalid key
 * so a misconfigured deploy sees them together; excess env keys are ignored by default.
 */
export function parseEnv<A, I>(schema: Schema.Schema<A, I>, env: EnvSource = process.env): A {
  try {
    return Schema.decodeUnknownSync(schema, { errors: 'all' })(env);
  } catch (caught) {
    const detail = caught instanceof Error ? caught.message : String(caught);
    throw new Error(`Invalid VybeKiit configuration:\n${detail}`);
  }
}
