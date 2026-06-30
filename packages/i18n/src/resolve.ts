import { i18nConfigSchema, parseEnv, type EnvSource } from '@vybekiit/core';
import { createLocalI18n } from './providers/local';
import type { I18nProvider } from './types';

/** Build the default i18n module from env — single adapter until #2 ships. */
export function createI18nFromEnv(env: EnvSource = process.env): I18nProvider {
  return createLocalI18n(parseEnv(i18nConfigSchema, env));
}

/** @deprecated Use {@link createI18nFromEnv} — kept for existing template imports. */
export const resolveI18nProvider = createI18nFromEnv;
