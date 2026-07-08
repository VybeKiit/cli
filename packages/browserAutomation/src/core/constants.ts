/**
 * Colocated provider dashboard + API endpoint URLs for browserAutomation. Kept out of
 * `@vybekiit/core` on purpose — core must not know about provider dashboards (ADR-0033).
 */

/** OpenAI models endpoint — used as the `whoami`-equivalent to verify an API key. */
export const OPENAI_MODELS_URL = 'https://api.openai.com/v1/models' as const;

/** Anthropic models endpoint — used as the `whoami`-equivalent to verify an API key. */
export const ANTHROPIC_MODELS_URL = 'https://api.anthropic.com/v1/models' as const;

/** GitHub authenticated-user endpoint — verifies a GitHub token. */
export const GITHUB_USER_URL = 'https://api.github.com/user' as const;

/** Resend domains endpoint — lightest authorized call to verify a Resend API key. */
export const RESEND_DOMAINS_URL = 'https://api.resend.com/domains' as const;

/** Sentry API root — used to verify a Sentry auth token. */
export const SENTRY_API_URL = 'https://sentry.io/api/0/' as const;

/** Supabase dashboard origin — entry point for browser-fallback project setup. */
export const SUPABASE_DASHBOARD_URL = 'https://supabase.com/dashboard' as const;

/** Cloudflare dashboard origin — entry point for browser-fallback token minting. */
export const CLOUDFLARE_DASHBOARD_URL = 'https://dash.cloudflare.com' as const;

/** Cloudflare REST API base — compose token/account paths from this. */
export const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4' as const;
