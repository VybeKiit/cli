/** Locales that render right-to-left — shared by server catalogs and browser templates. */
const RTL_LOCALES = new Set(['ar', 'he', 'fa', 'ur']);

/**
 * Return whether a BCP-47 locale tag should use RTL layout.
 *
 * @param locale - Locale tag to inspect.
 * @returns `true` when the locale base language is right-to-left.
 * @example
 * const rtl = isRtlLocale('ar-SA');
 */
export const isRtlLocale = (locale: string): boolean => {
  const [baseLocale] = locale.split('-');
  if (baseLocale === undefined) {
    return false;
  }
  const base = baseLocale.toLowerCase();
  return RTL_LOCALES.has(base);
};

/**
 * Resolve a requested locale, or return the configured default when it is empty.
 *
 * @param requested - Optional locale requested by the caller.
 * @param defaultLocale - Locale to use when no request is supplied.
 * @returns Trimmed requested locale or the configured default locale.
 * @example
 * const locale = resolveLocaleOrDefault('  fr  ', 'en');
 */
export const resolveLocaleOrDefault = (
  requested: string | undefined,
  defaultLocale: string,
): string => {
  if (requested === undefined) {
    return defaultLocale;
  }
  const trimmed = requested.trim();
  if (trimmed.length > 0) {
    return trimmed;
  }
  return defaultLocale;
};
