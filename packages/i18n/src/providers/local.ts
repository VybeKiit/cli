import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { I18nConfig } from '@vybekiit/core';
import type { I18nProvider } from '../types';

const RTL_LOCALES = new Set(['ar', 'he', 'fa', 'ur']);

export function createLocalI18n(config: I18nConfig): I18nProvider {
  return {
    name: 'local',
    resolveLocale(requested?: string | undefined): string {
      if (requested && requested.trim().length > 0) return requested.trim();
      return config.DEFAULT_LOCALE;
    },
    isRtl(locale: string): boolean {
      const base = locale.split('-')[0]?.toLowerCase() ?? locale;
      return RTL_LOCALES.has(base);
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
