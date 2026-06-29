import { parseEnv, tenancyConfigSchema } from '@vybekiit/core';
import { createBetterAuthTenancy } from './providers/better-auth';
import { createLocalTenancy } from './providers/local';
import type { TenancyProvider } from './types';

type EnvSource = Record<string, string | undefined>;

export function resolveTenancyProvider(env: EnvSource = process.env): TenancyProvider {
  const { TENANCY_PROVIDER } = parseEnv(tenancyConfigSchema, env);
  if (TENANCY_PROVIDER === 'local') return createLocalTenancy();
  return createBetterAuthTenancy();
}
