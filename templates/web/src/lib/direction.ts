/** Languages that render right-to-left (the set VybeKiit ships with). */
const RTL_LANGUAGES = new Set(['ar', 'he', 'fa', 'ur']);

/**
 * Derive page writing direction from the active i18n locale.
 *
 * @param locale - Active route locale, such as `en` or `he-IL`.
 * @returns The HTML direction for the locale.
 * @example
 * const direction = localeToDirection('he-IL');
 */
const localeToDirection = (locale: string): 'ltr' | 'rtl' => {
  const [language] = locale.split('-');
  const base = language === undefined || language === '' ? 'en' : language.toLowerCase();
  return RTL_LANGUAGES.has(base) ? 'rtl' : 'ltr';
};

/**
 * Derive the base language tag for `<html lang>`.
 *
 * @param locale - Active route locale, such as `en-US`.
 * @returns The base language subtag.
 * @example
 * const lang = localeToLang('en-US');
 */
const localeToLang = (locale: string): string => {
  const [language] = locale.split('-');
  return language === undefined || language === '' ? 'en' : language.toLowerCase();
};

export { localeToDirection, localeToLang };
