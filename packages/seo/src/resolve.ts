import { appConfigSchema, parseEnv, seoConfigSchema, type EnvSource } from '@vybekiit/core';
import { createLocalSeo } from './providers/local';
import type { SeoProvider } from './types';

export function resolveSeoProvider(env: EnvSource = process.env): SeoProvider {
  const seoConfig = parseEnv(seoConfigSchema, env);
  const app = parseEnv(appConfigSchema, env);
  return createLocalSeo(app, seoConfig);
}
