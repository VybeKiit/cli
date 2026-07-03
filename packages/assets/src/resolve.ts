import {
  appConfigSchema,
  awsConfigSchema,
  cloudflareConfigSchema,
  hostingConfigSchema,
  isCloudflareUnconfigured,
  isSupabaseUnconfigured,
  parseEnv,
  r2ConfigSchema,
  resolveEnvProvider,
  storageConfigSchema,
  supabaseConfigSchema,
  type AppConfig,
  type EnvSource,
} from '@vybekiit/core';
import {
  createAwsS3Delivery,
  createCloudflareR2Delivery,
  createCloudflareSupabaseDelivery,
  createLocalAssetDelivery,
  createVercelDelivery,
} from './providers';
import type { AssetDeliveryProvider } from './types';
import process from 'node:process';

const STORAGE_ANCHOR_KEYS = ['R2_BUCKET', 'SUPABASE_URL'] as const;

function isStorageUnconfigured(env: EnvSource): boolean {
  if (env.STORAGE_PROVIDER) return false;
  return STORAGE_ANCHOR_KEYS.every((key) => !env[key]);
}

function resolveCloudflareStackDelivery(env: EnvSource, app: AppConfig): AssetDeliveryProvider {
  if (isCloudflareUnconfigured(env)) {
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

/**
 * Construct the asset delivery provider from HOSTING + STORAGE env. The builder never
 * picks a CDN — the agent's stack settings route here automatically.
 */
export function resolveAssetDelivery(env: EnvSource = process.env): AssetDeliveryProvider {
  const { HOSTING_PROVIDER } = parseEnv(hostingConfigSchema, env);
  const app = parseEnv(appConfigSchema, env);

  return resolveEnvProvider(
    HOSTING_PROVIDER,
    {
      vercel: (source) => {
        if (!source.VERCEL_TOKEN) return createLocalAssetDelivery();
        return createVercelDelivery({ app });
      },
      railway: () => createLocalAssetDelivery(),
      aws: (source) => {
        if (!source.AWS_REGION) return createLocalAssetDelivery();
        const aws = parseEnv(awsConfigSchema, source);
        const cloudFrontDomain = source.AWS_CLOUDFRONT_DOMAIN;
        return createAwsS3Delivery({
          aws,
          app,
          ...(cloudFrontDomain ? { cloudFrontDomain } : {}),
        });
      },
      cloudflare: (source) => resolveCloudflareStackDelivery(source, app),
    },
    env,
    'cloudflare',
  );
}
