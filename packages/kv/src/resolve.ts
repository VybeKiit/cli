import {
  cloudflareConfigSchema,
  cloudflareKvConfigSchema,
  kvConfigSchema,
  parseEnv,
} from '@vybekiit/core';
import { createCloudflareKv } from './providers/cloudflare';
import { createLocalKv } from './providers/local';
import type { KvProvider } from './types';

type EnvSource = Record<string, string | undefined>;

function isCloudflareUnconfigured(env: EnvSource): boolean {
  return !(env.CLOUDFLARE_ACCOUNT_ID && env.CLOUDFLARE_API_TOKEN);
}

export function resolveKvProvider(env: EnvSource = process.env): KvProvider {
  const { KV_PROVIDER } = parseEnv(kvConfigSchema, env);
  if (KV_PROVIDER === 'upstash') {
    throw new Error('upstash KV adapter ships in a later step');
  }
  if (KV_PROVIDER === 'cloudflare' && isCloudflareUnconfigured(env)) {
    return createLocalKv();
  }
  if (KV_PROVIDER === 'cloudflare') {
    return createCloudflareKv(
      parseEnv(cloudflareConfigSchema, env),
      parseEnv(cloudflareKvConfigSchema, env),
    );
  }
  return createLocalKv();
}
