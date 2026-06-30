import {
  cloudflareConfigSchema,
  cloudflareKvConfigSchema,
  isCloudflareUnconfigured,
  kvConfigSchema,
  parseEnv,
  resolveEnvProvider,
  type EnvSource,
} from '@vybekiit/core';
import { createCloudflareKv } from './providers/cloudflare';
import { createLocalKv } from './providers/local';
import type { KvProvider } from './types';

export function resolveKvProvider(env: EnvSource = process.env): KvProvider {
  const { KV_PROVIDER } = parseEnv(kvConfigSchema, env);
  if (KV_PROVIDER === 'upstash') {
    throw new Error('upstash KV adapter ships in a later step');
  }
  return resolveEnvProvider(
    KV_PROVIDER,
    {
      cloudflare: (source) =>
        isCloudflareUnconfigured(source)
          ? createLocalKv()
          : createCloudflareKv(
              parseEnv(cloudflareConfigSchema, source),
              parseEnv(cloudflareKvConfigSchema, source),
            ),
      local: () => createLocalKv(),
    },
    env,
    'local',
  );
}
