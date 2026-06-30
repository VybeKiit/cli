import { parseEnv, tenancyConfigSchema, type EnvSource } from '@vybekiit/core';
import { createBetterAuthTenancy, type ResolveTenancyInjections } from './providers/better-auth';
import { createLocalTenancy } from './providers/local';
import type { TenancyProvider } from './types';

export type { ResolveTenancyInjections } from './providers/better-auth';

export function resolveTenancyProvider(
  env: EnvSource = process.env,
  injections: ResolveTenancyInjections = {},
): TenancyProvider {
  const { TENANCY_PROVIDER } = parseEnv(tenancyConfigSchema, env);
  if (TENANCY_PROVIDER === 'local') return createLocalTenancy();
  return createBetterAuthTenancy(injections);
}
