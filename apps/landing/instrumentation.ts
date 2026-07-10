/**
 * Next.js instrumentation — registers Sentry for Node and Edge runtimes.
 *
 * The guard reads the literal `process.env.NEXT_RUNTIME` on purpose: Next replaces it
 * with a per-target constant at build time, so the edge compilation dead-code-
 * eliminates the Node-only Sentry path.
 */
import { captureRequestError } from '@sentry/nextjs';

/**
 * Register server instrumentation hooks for the landing app.
 *
 * @returns A promise that resolves when Sentry config finishes loading (or is skipped).
 * @example
 * // Next.js calls this automatically — do not invoke from app code.
 * await register();
 */
export const register = async (): Promise<void> => {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
};

/** Automatically captures unhandled server-side request errors (@sentry/nextjs ≥ 8.28.0). */
export const onRequestError = captureRequestError;
