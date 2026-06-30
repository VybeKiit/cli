/**
 * Next.js instrumentation — initializes error tracking when Sentry is configured.
 * Wired by the track-errors skill; safe no-op when OBSERVABILITY_PROVIDER=local.
 */
import process from 'node:process';
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { resolveObservabilityProvider } = await import('@vybekiit/observability');
    resolveObservabilityProvider(process.env);
  }
}
