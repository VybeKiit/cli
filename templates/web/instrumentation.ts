/**
 * Next.js instrumentation — initializes error tracking when Sentry is configured.
 * Wired by the track-errors skill; safe no-op when OBSERVABILITY_PROVIDER=local.
 *
 * The guard reads the literal `process.env.NEXT_RUNTIME` on purpose: Next replaces it
 * with a per-target constant at build time, so the **edge** compilation dead-code-
 * eliminates the dynamic `@vybekiit/core/observability` import and never pulls the
 * Node-only `@sentry/node` into the edge bundle. The `readNodeEnv()` shim can't be
 * statically analysed (defeats that DCE) and the `node:process` import that
 * `noProcessGlobal`'s autofix wants would itself break the edge build — so this one
 * guard keeps the raw form under an ignore, and the body uses the shim as usual.
 */
import { readNodeEnv } from '@/lib/nodeEnv';

export async function register(): Promise<void> {
  // biome-ignore lint/correctness/noProcessGlobal: literal `process.env.NEXT_RUNTIME` must stay statically analysable for Next's edge DCE (see file header).
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { resolveObservabilityProvider } = await import('@vybekiit/core/observability');
    resolveObservabilityProvider(readNodeEnv());
  }
}
