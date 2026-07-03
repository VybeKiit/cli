import { browser } from 'wxt/browser';

/** Languages that render right-to-left (the set VybeKiit ships with). */
const RTL_LANGUAGES = new Set(['ar', 'he', 'fa', 'ur']);

/** Derive writing direction from the active Chrome UI locale. */
export function localeToDirection(locale: string): 'ltr' | 'rtl' {
  const base = locale.split('-')[0]?.toLowerCase() ?? 'en';
  return RTL_LANGUAGES.has(base) ? 'rtl' : 'ltr';
}

/** Active locale from the browser (Chrome i18n API). */
export function getActiveLocale(): string {
  return browser.i18n.getUILanguage().split('-')[0] ?? 'en';
}

/** Translate a flat-dotted message key via Chrome `_locales/`. */
export function t(key: string, substitutions?: string | string[]): string {
  const i18nApi = browser.i18n as unknown as {
    getMessage: (messageName: string, substitutions?: string | string[]) => string;
  };
  return i18nApi.getMessage(key, substitutions) || key;
}
