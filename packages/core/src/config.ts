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

/** Supabase credentials — used by `@vybekiit/auth` and `@vybekiit/db`. */
export const supabaseConfigSchema = z.object({
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required'),
  // Server-only; the browser client never sets it.
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
});

/** Cloudflare credentials — used at deploy time and by `@vybekiit/email`. */
export const cloudflareConfigSchema = z.object({
  CLOUDFLARE_ACCOUNT_ID: z.string().min(1, 'CLOUDFLARE_ACCOUNT_ID is required'),
  CLOUDFLARE_API_TOKEN: z.string().min(1, 'CLOUDFLARE_API_TOKEN is required'),
});

/** GitHub access automation — "the gate" that grants/revokes paid repo access. */
export const githubGateConfigSchema = z.object({
  GITHUB_GATE_TOKEN: z.string().min(1, 'GITHUB_GATE_TOKEN is required'),
  GITHUB_GATE_ORG: z.string().min(1).default('VybeKiit'),
  GITHUB_GATE_REPO: z.string().min(1).default('vybekiit'),
});

export type AppConfig = z.infer<typeof appConfigSchema>;
export type PaymentsConfig = z.infer<typeof paymentsConfigSchema>;
export type LemonSqueezyConfig = z.infer<typeof lemonSqueezyConfigSchema>;
export type StripeConfig = z.infer<typeof stripeConfigSchema>;
export type PaypalConfig = z.infer<typeof paypalConfigSchema>;
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
