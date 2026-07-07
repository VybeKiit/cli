import { type EnvSource, parseEnv } from '@vybekiit/core';

import { ClientStateConfigSchema } from './config';
import { createQueryClient } from './query/client';
import type { ClientStateSurface, ResolvedClientState } from './types';
import { createUiStore } from './uiStore/createStore';

/**
 * Resolve client-state services for a template runtime surface.
 *
 * @param surface - Runtime surface requesting client-state services.
 * @param env - Environment source used to parse the client-state config slice.
 * @returns Query client, UI-store factory, and persistence settings.
 * @example
 * const state = resolveClientState('web', process.env);
 */
export const resolveClientState = (
  surface: ClientStateSurface,
  env: EnvSource = process.env,
): ResolvedClientState => {
  const config = parseEnv(ClientStateConfigSchema, env);
  const queryClient = createQueryClient(config);

  return {
    surface,
    queryClient,
    queryStaleSeconds: config.CLIENT_STATE_QUERY_STALE_SECONDS,
    persistEnabled: config.CLIENT_STATE_PERSIST === 'on',
    createUiStore,
  };
};
