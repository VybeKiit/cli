import {
  appConfigSchema,
  awsConfigSchema,
  cloudflareConfigSchema,
  hostingConfigSchema,
  parseEnv,
  r2ConfigSchema,
  storageConfigSchema,
  supabaseConfigSchema,
} from '@vybekiit/core';
import {
  createAwsS3Delivery,
  createCloudflareR2Delivery,
  createCloudflareSupabaseDelivery,
  createLocalAssetDelivery,
  createVercelDelivery,
} from './providers/index';
import type { AssetDeliveryProvider } from './types';

/** A readable view of `process.env` that doesn't require `@types/node` here. */
type EnvSource = Record<string, string | undefined>;

const STORAGE_ANCHOR_KEYS = ['R2_BUCKET', 'SUPABASE_URL'] as const;

function isCloudflareUnconfigured(env: EnvSource): boolean {
  return !(env.CLOUDFLARE_ACCOUNT_ID && env.CLOUDFLARE_API_TOKEN);
}

function isSupabaseUnconfigured(env: EnvSource): boolean {
  return !(env.SUPABASE_URL && env.SUPABASE_ANON_KEY);
}

function isStorageUnconfigured(env: EnvSource): boolean {
  if (env.STORAGE_PROVIDER) return false;
  return STORAGE_ANCHOR_KEYS.every((key) => !env[key]);
}

/**
 * Construct the asset delivery provider from HOSTING + STORAGE env. The builder never
 * picks a CDN — the agent's stack settings route here automatically.
 */
export function resolveAssetDelivery(env: EnvSource = process.env): AssetDeliveryProvider {
  const { HOSTING_PROVIDER } = parseEnv(hostingConfigSchema, env);
  const app = parseEnv(appConfigSchema, env);

  if (HOSTING_PROVIDER === 'vercel') {
    if (!env.VERCEL_TOKEN) {
      return createLocalAssetDelivery();
    }
    return createVercelDelivery({ app });
  }

  if (HOSTING_PROVIDER === 'aws') {
    if (!env.AWS_REGION) {
      return createLocalAssetDelivery();
    }
    const aws = parseEnv(awsConfigSchema, env);
    const cloudFrontDomain = env.AWS_CLOUDFRONT_DOMAIN;
    return createAwsS3Delivery({
      aws,
      app,
      ...(cloudFrontDomain ? { cloudFrontDomain } : {}),
    });
  }

  if (HOSTING_PROVIDER === 'cloudflare' && isCloudflareUnconfigured(env)) {
    return createLocalAssetDelivery();
  }

  const cloudflare = parseEnv(cloudflareConfigSchema, env);
  const { STORAGE_PROVIDER } = parseEnv(storageConfigSchema, env);

  if (STORAGE_PROVIDER === 'r2' || (!isStorageUnconfigured(env) && env.R2_BUCKET)) {
    if (!(env.R2_BUCKET && env.R2_PUBLIC_URL)) {
      return createLocalAssetDelivery();
    }
    const r2 = parseEnv(r2ConfigSchema, env);
    return createCloudflareR2Delivery({ cloudflare, r2, app });
  }

  if (STORAGE_PROVIDER === 's3') {
    const aws = parseEnv(awsConfigSchema, env);
    const cloudFrontDomain = env.AWS_CLOUDFRONT_DOMAIN;
    return createAwsS3Delivery({
      aws,
      app,
      ...(cloudFrontDomain ? { cloudFrontDomain } : {}),
    });
  }

  if (isSupabaseUnconfigured(env)) {
    return createLocalAssetDelivery();
  }

  const supabase = parseEnv(supabaseConfigSchema, env);
  return createCloudflareSupabaseDelivery({ cloudflare, supabase, app });
}
