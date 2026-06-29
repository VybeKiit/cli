import { resolveObservabilityProvider } from '@vybekiit/observability';

/** Error tracking — no-op until track-errors wires Sentry. */
export const observability = resolveObservabilityProvider(process.env);
