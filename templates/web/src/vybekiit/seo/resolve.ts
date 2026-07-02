import { appConfigSchema, parseEnv, seoConfigSchema, type EnvSource } from '@vybekiit/core';
import { createLocalSeo } from './providers/local';
import type { SeoProvider } from './types';
import process from 'node:process';

/** Build the default SEO module from env — single adapter until #2 ships. */
export function createSeoFromEnv(env: EnvSource = process.env): SeoProvider {
  const seoConfig = parseEnv(seoConfigSchema, env);
  const app = parseEnv(appConfigSchema, env);
  return createLocalSeo(app, seoConfig);
}

/** @deprecated Use {@link createSeoFromEnv} — kept for existing template imports. */
export const resolveSeoProvider = createSeoFromEnv;
