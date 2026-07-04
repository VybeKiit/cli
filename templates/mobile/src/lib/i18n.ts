import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';
import { resolveLocaleOrDefault } from '@vybekiit/i18n/localeRules';
import en from '../../messages/en.json' with { type: 'json' };
import { applyRtlForLocale } from './direction';

/** Flat dotted keys → nested object for i18n-js scope lookup. */
function flatToNested(flat: Record<string, string>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.');
    let current: Record<string, unknown> = result;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i] ?? '';
      const next = current[part];
      if (typeof next !== 'object' || next === null) {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }
    const leaf = parts[parts.length - 1] ?? key;
    current[leaf] = value;
  }
  return result;
}

/** Supported locale catalogs (flat on disk, nested in memory). */
const flatCatalogs: Record<string, Record<string, string>> = { en };
const nestedCatalogs: Record<string, Record<string, unknown>> = {
  en: flatToNested(en) as Record<string, unknown>,
};

export const i18n = new I18n(nestedCatalogs);
i18n.defaultLocale = 'en';
i18n.enableFallback = true;
i18n.locale = 'en';

/** Pick the best device locale that has a catalog, falling back to `en`. */
export function resolveDeviceLocale(): string {
  const device = getLocales()[0]?.languageCode ?? 'en';
  const resolved = resolveLocaleOrDefault(device, 'en');
  return resolved in flatCatalogs ? resolved : 'en';
}

/** Load device locale + RTL once at app start (call from root layout). */
export function initI18n(): string {
  const locale = resolveDeviceLocale();
  i18n.store(nestedCatalogs);
  i18n.locale = locale;
  applyRtlForLocale(locale);
  return locale;
}

/** Translate a flat-dotted message key. */
export function t(key: string, options?: Record<string, string | number>): string {
  return i18n.t(key, options);
}

/** Register an additional locale catalog (used by `add-language` skill). */
export function registerLocale(locale: string, messages: Record<string, string>): void {
  flatCatalogs[locale] = messages;
  nestedCatalogs[locale] = flatToNested(messages) as Record<string, unknown>;
  i18n.store(nestedCatalogs);
}
