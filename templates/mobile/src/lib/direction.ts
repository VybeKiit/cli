import { I18nManager } from 'react-native';

/** Languages that render right-to-left (the set VybeKiit ships with). */
const RTL_LANGUAGES = new Set(['ar', 'he', 'fa', 'ur']);

/**
 * Derive writing direction from the active locale.
 *
 * @param locale - BCP-47 locale string such as `en-US` or `he-IL`.
 * @returns The layout direction React Native should use.
 * @example
 * const direction = localeToDirection('he-IL');
 */
export const localeToDirection = (locale: string): 'ltr' | 'rtl' => {
  const [language] = locale.split('-');
  const base = language === undefined || language.length === 0 ? 'en' : language.toLowerCase();
  return RTL_LANGUAGES.has(base) ? 'rtl' : 'ltr';
};

/**
 * Apply RTL layout when the device locale requires it.
 *
 * @param locale - BCP-47 locale string selected for the app.
 * @returns Nothing; mutates React Native's global RTL manager when needed.
 * @example
 * applyRtlForLocale('ar');
 */
export const applyRtlForLocale = (locale: string): void => {
  const shouldRtl = localeToDirection(locale) === 'rtl';
  if (I18nManager.isRTL !== shouldRtl) {
    I18nManager.allowRTL(shouldRtl);
    I18nManager.forceRTL(shouldRtl);
  }
};
