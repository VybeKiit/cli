import { clientStateConfigSchema, parseEnv } from '@vybekiit/core';

import { createQueryClient } from './query/client';
import { createUiStore } from './ui-store/create-store';
import type { ClientStateSurface, ResolvedClientState } from './types';

type EnvSource = Record<string, string | undefined>;

export function resolveClientState(
  surface: ClientStateSurface,
  env: EnvSource = process.env,
): ResolvedClientState {
  const config = parseEnv(clientStateConfigSchema, env);
  const queryClient = createQueryClient(config);

  return {
    surface,
    queryClient,
    queryStaleSeconds: config.CLIENT_STATE_QUERY_STALE_SECONDS,
    persistEnabled: config.CLIENT_STATE_PERSIST === 'on',
    createUiStore,
  };
}
