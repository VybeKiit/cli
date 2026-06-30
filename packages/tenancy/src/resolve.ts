import { parseEnv, tenancyConfigSchema, type EnvSource } from '@vybekiit/core';
import { createBetterAuthTenancy } from './providers/better-auth';
import { createLocalTenancy } from './providers/local';
import type { TenancyProvider } from './types';

export function resolveTenancyProvider(env: EnvSource = process.env): TenancyProvider {
  const { TENANCY_PROVIDER } = parseEnv(tenancyConfigSchema, env);
  if (TENANCY_PROVIDER === 'local') return createLocalTenancy();
  return createBetterAuthTenancy();
}
