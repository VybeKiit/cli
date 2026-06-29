import { I18nManager } from 'react-native';

/** Languages that render right-to-left (the set VybeKiit ships with). */
const RTL_LANGUAGES = new Set(['ar', 'he', 'fa', 'ur']);

/** Derive writing direction from the active locale. */
export function localeToDirection(locale: string): 'ltr' | 'rtl' {
  const base = locale.split('-')[0]?.toLowerCase() ?? 'en';
  return RTL_LANGUAGES.has(base) ? 'rtl' : 'ltr';
}

/** Apply RTL layout when the device locale requires it (per ADR-0004). */
export function applyRtlForLocale(locale: string): void {
  const shouldRtl = localeToDirection(locale) === 'rtl';
  if (I18nManager.isRTL !== shouldRtl) {
    I18nManager.allowRTL(shouldRtl);
    I18nManager.forceRTL(shouldRtl);
  }
}
