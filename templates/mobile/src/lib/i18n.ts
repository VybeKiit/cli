import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';
import { resolveLocaleOrDefault } from '@vybekiit/i18n/localeRules';
import en from '../../messages/en.json' with { type: 'json' };
import { applyRtlForLocale } from './direction';

/**
 * Convert flat dotted message keys into an i18n-js nested catalog.
 *
 * @param flat - Flat catalog keyed by dotted message paths.
 * @returns Nested catalog for i18n-js scope lookup.
 * @example
 * const nested = flatToNested({ 'common.close': 'Close' });
 */
const flatToNested = (flat: Record<string, string>): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.');
    let current: Record<string, unknown> = result;
    for (let i = 0; i < parts.length - 1; i++) {
      const pathPart = parts[i];
      const part = pathPart === undefined ? '' : pathPart;
      const next = current[part];
      if (typeof next !== 'object' || next === null) {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }
    const lastPart = parts.at(-1);
    const leaf = lastPart === undefined ? key : lastPart;
    current[leaf] = value;
  }
  return result;
};

/** Supported locale catalogs (flat on disk, nested in memory). */
const flatCatalogs: Record<string, Record<string, string>> = { en };
const nestedCatalogs: Record<string, Record<string, unknown>> = {
  en: flatToNested(en) as Record<string, unknown>,
};

/** Mobile i18n runtime configured with the bundled message catalogs. */
export const i18n = new I18n(nestedCatalogs);
i18n.defaultLocale = 'en';
i18n.enableFallback = true;
i18n.locale = 'en';

/**
 * Pick the best device locale that has a catalog.
 *
 * @returns The supported locale selected for the device.
 * @example
 * const locale = resolveDeviceLocale();
 */
export const resolveDeviceLocale = (): string => {
  const [deviceLocale] = getLocales();
  const languageCode =
    deviceLocale === undefined || deviceLocale.languageCode === null
      ? 'en'
      : deviceLocale.languageCode;
  const device = languageCode.length === 0 ? 'en' : languageCode;
  const resolved = resolveLocaleOrDefault(device, 'en');
  return resolved in flatCatalogs ? resolved : 'en';
};

/**
 * Load device locale and RTL once at app start.
 *
 * @returns The locale activated for this process.
 * @example
 * const locale = initI18n();
 */
export const initI18n = (): string => {
  const locale = resolveDeviceLocale();
  i18n.store(nestedCatalogs);
  i18n.locale = locale;
  applyRtlForLocale(locale);
  return locale;
};

/**
 * Translate a flat-dotted message key.
 *
 * @param key - Message key from the active catalog.
 * @param options - Optional interpolation values.
 * @returns The translated message or i18n-js missing-message text.
 * @example
 * const label = t('common.close');
 */
export const t = (key: string, options?: Record<string, string | number>): string =>
  i18n.t(key, options);

/**
 * Register an additional locale catalog.
 *
 * @param locale - Locale code for the catalog.
 * @param messages - Flat dotted message map to register.
 * @returns Nothing; updates the in-memory i18n catalog.
 * @example
 * registerLocale('es', { 'common.close': 'Cerrar' });
 */
export const registerLocale = (locale: string, messages: Record<string, string>): void => {
  flatCatalogs[locale] = messages;
  nestedCatalogs[locale] = flatToNested(messages) as Record<string, unknown>;
  i18n.store(nestedCatalogs);
};
