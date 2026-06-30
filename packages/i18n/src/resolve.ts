import { i18nConfigSchema, parseEnv, type EnvSource } from '@vybekiit/core';
import { createLocalI18n } from './providers/local';
import type { I18nProvider } from './types';

export function resolveI18nProvider(env: EnvSource = process.env): I18nProvider {
  const config = parseEnv(i18nConfigSchema, env);
  return createLocalI18n(config);
}
