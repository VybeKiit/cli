import { resolveObservabilityProvider } from '@vybekiit/observability';
import process from 'node:process';

/** Error tracking — no-op until track-errors wires Sentry. */
export const observability = resolveObservabilityProvider(process.env);
