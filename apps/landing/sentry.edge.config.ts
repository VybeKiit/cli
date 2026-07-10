import { init } from '@sentry/nextjs';

/**
 * Edge runtime Sentry init for the VybeKiit store (apps/landing).
 * Loaded from `instrumentation.ts` when `NEXT_RUNTIME === "edge"`.
 *
 * Requires `SENTRY_DSN`. Without a DSN the SDK stays disabled.
 * Cloudflare Workers (OpenNext) needs `nodejs_compat` + compatibility_date ≥ 2025-08-16
 * (already set in `wrangler.jsonc`).
 */
init({
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 100% in dev, 10% in production
  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,

  enableLogs: true,
});
