import process from 'node:process';
import {
  cloudflareConfigSchema,
  cloudflareKvConfigSchema,
  type EnvSource,
  isCloudflareUnconfigured,
  kvConfigSchema,
  parseEnv,
  resolveEnvProvider,
} from '@vybekiit/core';
import { createCloudflareKv } from './providers/cloudflare';
import { createLocalKv } from './providers/local';
import type { KvProvider } from './types';

export function resolveKvProvider(env: EnvSource = process.env): KvProvider {
  const { KV_PROVIDER } = parseEnv(kvConfigSchema, env);
  if (KV_PROVIDER === 'upstash') {
    return createLocalKv();
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
