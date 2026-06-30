import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { I18nConfig } from '@vybekiit/core';
import { isRtlLocale, resolveLocaleOrDefault } from '../locale-rules';
import type { I18nProvider } from '../types';

export function createLocalI18n(config: I18nConfig): I18nProvider {
  return {
    name: 'local',
    resolveLocale(requested?: string | undefined): string {
      return resolveLocaleOrDefault(requested, config.DEFAULT_LOCALE);
    },
    isRtl(locale: string): boolean {
      return isRtlLocale(locale);
    },
    async loadCatalog(locale: string): Promise<Record<string, string>> {
      const path = join(process.cwd(), config.MESSAGES_DIR, `${locale}.json`);
      try {
        const raw = await readFile(path, 'utf8');
        return JSON.parse(raw) as Record<string, string>;
      } catch {
        if (locale !== config.DEFAULT_LOCALE) {
          return createLocalI18n(config).loadCatalog(config.DEFAULT_LOCALE);
        }
        return {};
      }
    },
  };
}
