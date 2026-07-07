import {
  authConfigSchema,
  dataConfigSchema,
  emailConfigSchema,
  hostingConfigSchema,
  parseEnv,
  storageConfigSchema,
} from './config';
import type { EnvSource } from './envSource';

/**
 * Canonical backend anchor keys — any one signals the builder wired a real backend.
 * Shared by auth and data resolvers for ADR-0008 local dev adapter fallback (ADR-0018).
 */
export const BACKEND_ANCHOR_KEYS = [
  'BETTER_AUTH_SECRET',
  'DATABASE_URL',
  'COGNITO_USER_POOL_ID',
  'SUPABASE_URL',
  'FIREBASE_PROJECT_ID',
  'MONGODB_URI',
  'AWS_REGION',
] as const;

/**
 * True when neither an explicit provider nor any backend anchor key is set — the
 * local dev adapter case (ADR-0008). Checked against raw env before {@link parseEnv}
 * defaults mask the empty case.
 *
 * @param env - Raw environment source to inspect before Schema defaults apply.
 * @returns Whether the backend should use the local zero-config path.
 * @example
 * isBackendUnconfigured({}) === true;
 */
export const isBackendUnconfigured = (env: EnvSource): boolean => {
  if (env.AUTH_PROVIDER || env.DATA_PROVIDER) {
    return false;
  }
  return BACKEND_ANCHOR_KEYS.every((key) => !env[key]);
};

/**
 * Check whether Cloudflare account credentials are absent.
 *
 * @param env - Raw environment source to inspect.
 * @returns Whether Cloudflare-dependent tooling should treat the workspace as unconfigured.
 * @example
 * isCloudflareUnconfigured({ CLOUDFLARE_ACCOUNT_ID: 'id' }) === true;
 */
export const isCloudflareUnconfigured = (env: EnvSource): boolean =>
  !(env.CLOUDFLARE_ACCOUNT_ID && env.CLOUDFLARE_API_TOKEN);

/**
 * Check whether Supabase browser credentials are absent.
 *
 * @param env - Raw environment source to inspect.
 * @returns Whether Supabase-dependent tooling should use local fallbacks.
 * @example
 * isSupabaseUnconfigured({ SUPABASE_URL: 'https://x.supabase.co' }) === true;
 */
export const isSupabaseUnconfigured = (env: EnvSource): boolean =>
  !(env.SUPABASE_URL && env.SUPABASE_ANON_KEY);

/**
 * True when Railway hosting or data is active in the buyer's env.
 * Uses parsed provider keys (not raw string compares) — ADR-0018.
 *
 * @param env - Raw environment source to decode through the provider schemas.
 * @returns Whether either hosting or data is configured for Railway.
 * @example
 * isRailwayStackActive({ HOSTING_PROVIDER: 'railway' }) === true;
 */
export const isRailwayStackActive = (env: EnvSource): boolean => {
  const { HOSTING_PROVIDER } = parseEnv(hostingConfigSchema, env);
  const { DATA_PROVIDER } = parseEnv(dataConfigSchema, env);
  return HOSTING_PROVIDER === 'railway' || DATA_PROVIDER === 'railway';
};

/**
 * True when any non-hosting/data AWS adapter needs the AWS CLI in doctor's toolchain
 * (storage S3, SES email, Cognito auth). Hosting/data AWS are resolved via registries.
 *
 * @param env - Raw environment source to decode through provider schemas.
 * @returns Whether the doctor command should require the AWS CLI.
 * @example
 * needsAwsCliFromAuxiliaryProviders({ EMAIL_PROVIDER: 'ses' }) === true;
 */
export const needsAwsCliFromAuxiliaryProviders = (env: EnvSource): boolean => {
  const { STORAGE_PROVIDER } = parseEnv(storageConfigSchema, env);
  const { EMAIL_PROVIDER } = parseEnv(emailConfigSchema, env);
  const { AUTH_PROVIDER } = parseEnv(authConfigSchema, env);
  return STORAGE_PROVIDER === 's3' || EMAIL_PROVIDER === 'ses' || AUTH_PROVIDER === 'cognito';
};
