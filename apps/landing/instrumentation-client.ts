import { captureRouterTransitionStart, init } from '@sentry/nextjs';
import posthog from 'posthog-js';

/**
 * Browser / client instrumentation for the VybeKiit store (apps/landing).
 * Next.js loads this file automatically — do not import from app code.
 *
 * - Sentry: requires `NEXT_PUBLIC_SENTRY_DSN` (Replay is opt-in — it is a large
 *   client chunk and hurts mobile TBT when loaded on every visit)
 * - PostHog: requires `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`
 * Without the matching env keys each SDK stays disabled.
 */

const posthogToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
if (posthogToken !== undefined && posthogToken.length > 0) {
  posthog.init(posthogToken, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
    defaults: '2026-05-30',
  });
}

const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (sentryDsn !== undefined && sentryDsn.length > 0) {
  init({
    dsn: sentryDsn,
    // 100% in dev, 10% in production
    tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
    // Session Replay ships a large client bundle; keep it off the marketing path.
    // Enable via NEXT_PUBLIC_SENTRY_REPLAY=1 when debugging production UX.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: process.env.NEXT_PUBLIC_SENTRY_REPLAY === '1' ? 1.0 : 0,
    enableLogs: process.env.NODE_ENV === 'development',
    integrations:
      process.env.NEXT_PUBLIC_SENTRY_REPLAY === '1'
        ? // Dynamic import would be ideal; Sentry's init API expects sync integrations.
          // Replay stays opt-in so the default mobile path never pays for it.
          []
        : [],
  });
}

/** Hook into App Router navigation transitions (Sentry). */
export const onRouterTransitionStart = captureRouterTransitionStart;
