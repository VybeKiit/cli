import { init } from '@sentry/nextjs';

/**
 * Node.js server runtime Sentry init for the VybeKiit store (apps/landing).
 * Loaded from `instrumentation.ts` when `NEXT_RUNTIME === "nodejs"`.
 *
 * Requires `SENTRY_DSN`. Without a DSN the SDK stays disabled.
 */
init({
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 100% in dev, 10% in production
  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,

  // Attach local variable values to stack frames
  includeLocalVariables: true,

  enableLogs: true,
});
