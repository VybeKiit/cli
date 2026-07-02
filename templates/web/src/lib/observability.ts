import { resolveObservabilityProvider } from '@vybekiit/core/observability';
import { readNodeEnv } from '@/lib/nodeEnv';

/** Error tracking — no-op until track-errors wires Sentry. */
// Env via the `readNodeEnv()` shim (never the bare `process` global) so `biome --write`
// can't re-add a `node:process` import now that observability is a subpath of the
// transpiled @vybekiit/core rather than an external dep.
export const observability = resolveObservabilityProvider(readNodeEnv());
