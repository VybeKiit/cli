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

/** Core app settings — always available (both have safe defaults). */
export const appConfigSchema = z.object({
  APP_URL: z.string().url().default(DEFAULT_APP_URL),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
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
 * ship in a later step (ADR-0002).
 */
export const dataConfigSchema = z.object({
  DATA_PROVIDER: z.enum(['supabase', 'mongodb', 'aws']).default('supabase'),
});

/**
 * Which object-storage adapter `@vybekiit/db` constructs for file uploads. Supabase
 * Storage is the default; `s3` is an opt-in adapter shipping later (ADR-0002).
 */
export const storageConfigSchema = z.object({
  STORAGE_PROVIDER: z.enum(['supabase', 's3']).default('supabase'),
});

/**
 * Which hosting adapter `@vybekiit/deploy` constructs at go-live. Cloudflare is the
 * default; `aws` (Amplify/SST) is an opt-in adapter shipping later (ADR-0002). The
 * agent's go-live skill drives the chosen adapter — the builder never picks.
 */
export const hostingConfigSchema = z.object({
  HOSTING_PROVIDER: z.enum(['cloudflare', 'aws']).default('cloudflare'),
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

/** Supabase credentials — used by `@vybekiit/auth` and `@vybekiit/db`. */
export const supabaseConfigSchema = z.object({
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required'),
  // Server-only; the browser client never sets it.
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
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

/** GitHub access automation — "the gate" that grants/revokes paid repo access. */
export const githubGateConfigSchema = z.object({
  GITHUB_GATE_TOKEN: z.string().min(1, 'GITHUB_GATE_TOKEN is required'),
  GITHUB_GATE_ORG: z.string().min(1).default('VybeKiit'),
  GITHUB_GATE_REPO: z.string().min(1).default('vybekiit'),
});

export type AppConfig = z.infer<typeof appConfigSchema>;
export type PaymentsConfig = z.infer<typeof paymentsConfigSchema>;
export type DataConfig = z.infer<typeof dataConfigSchema>;
export type StorageConfig = z.infer<typeof storageConfigSchema>;
export type HostingConfig = z.infer<typeof hostingConfigSchema>;
export type EmailConfig = z.infer<typeof emailConfigSchema>;
export type LemonSqueezyConfig = z.infer<typeof lemonSqueezyConfigSchema>;
export type StripeConfig = z.infer<typeof stripeConfigSchema>;
export type PaypalConfig = z.infer<typeof paypalConfigSchema>;
export type MongoConfig = z.infer<typeof mongoConfigSchema>;
export type AwsConfig = z.infer<typeof awsConfigSchema>;
export type AwsHostingConfig = z.infer<typeof awsHostingConfigSchema>;
export type SupabaseConfig = z.infer<typeof supabaseConfigSchema>;
export type CloudflareConfig = z.infer<typeof cloudflareConfigSchema>;
export type GithubGateConfig = z.infer<typeof githubGateConfigSchema>;

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
