import {
  authConfigSchema,
  dataConfigSchema,
  emailConfigSchema,
  hostingConfigSchema,
  parseEnv,
  storageConfigSchema,
} from './config';
import type { EnvSource } from './env-source';

/** True when Cloudflare account credentials are absent — local/zero-config fallbacks apply. */
export function isCloudflareUnconfigured(env: EnvSource): boolean {
  return !(env.CLOUDFLARE_ACCOUNT_ID && env.CLOUDFLARE_API_TOKEN);
}

/** True when Supabase project URL + anon key are absent — local fallbacks apply. */
export function isSupabaseUnconfigured(env: EnvSource): boolean {
  return !(env.SUPABASE_URL && env.SUPABASE_ANON_KEY);
}

/**
 * True when Railway hosting or data is active in the buyer's env.
 * Uses parsed provider keys (not raw string compares) — ADR-0018.
 */
export function isRailwayStackActive(env: EnvSource): boolean {
  const { HOSTING_PROVIDER } = parseEnv(hostingConfigSchema, env);
  const { DATA_PROVIDER } = parseEnv(dataConfigSchema, env);
  return HOSTING_PROVIDER === 'railway' || DATA_PROVIDER === 'railway';
}

/**
 * True when any non-hosting/data AWS adapter needs the AWS CLI in doctor's toolchain
 * (storage S3, SES email, Cognito auth). Hosting/data AWS are resolved via registries.
 */
export function needsAwsCliFromAuxiliaryProviders(env: EnvSource): boolean {
  const { STORAGE_PROVIDER } = parseEnv(storageConfigSchema, env);
  const { EMAIL_PROVIDER } = parseEnv(emailConfigSchema, env);
  const { AUTH_PROVIDER } = parseEnv(authConfigSchema, env);
  return (
    STORAGE_PROVIDER === 's3' || EMAIL_PROVIDER === 'ses' || AUTH_PROVIDER === 'cognito'
  );
}
