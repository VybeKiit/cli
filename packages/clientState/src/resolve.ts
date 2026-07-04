import { type EnvSource, parseEnv } from '@vybekiit/core';

import { ClientStateConfigSchema } from './config';
import { createQueryClient } from './query/client';
import type { ClientStateSurface, ResolvedClientState } from './types';
import { createUiStore } from './uiStore/createStore';

export function resolveClientState(
  surface: ClientStateSurface,
  env: EnvSource = process.env,
): ResolvedClientState {
  const config = parseEnv(ClientStateConfigSchema, env);
  const queryClient = createQueryClient(config);

  return {
    surface,
    queryClient,
    queryStaleSeconds: config.CLIENT_STATE_QUERY_STALE_SECONDS,
    persistEnabled: config.CLIENT_STATE_PERSIST === 'on',
    createUiStore,
  };
}
