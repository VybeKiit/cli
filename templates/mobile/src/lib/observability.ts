import { resolveObservabilityProvider } from '@vybekiit/core/observability';
import { readNodeEnv } from '@/lib/nodeEnv';

/** Error tracking — no-op until track-errors wires Sentry. */
export const observability = resolveObservabilityProvider(readNodeEnv());
