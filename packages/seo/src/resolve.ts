import { appConfigSchema, parseEnv, seoConfigSchema } from '@vybekiit/core';
import { createLocalSeo } from './providers/local';
import type { SeoProvider } from './types';

type EnvSource = Record<string, string | undefined>;

export function resolveSeoProvider(env: EnvSource = process.env): SeoProvider {
  const seoConfig = parseEnv(seoConfigSchema, env);
  const app = parseEnv(appConfigSchema, env);
  return createLocalSeo(app, seoConfig);
}
