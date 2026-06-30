/** Locales that render right-to-left — shared by server catalogs and browser templates. */
const RTL_LOCALES = new Set(['ar', 'he', 'fa', 'ur']);

/** Whether a BCP-47 locale tag should use RTL layout. */
export function isRtlLocale(locale: string): boolean {
  const base = locale.split('-')[0]?.toLowerCase() ?? locale;
  return RTL_LOCALES.has(base);
}

/** Pick a trimmed locale or fall back when the request is empty. */
export function resolveLocaleOrDefault(
  requested: string | undefined,
  defaultLocale: string,
): string {
  if (requested && requested.trim().length > 0) {
    return requested.trim();
  }
  return defaultLocale;
}
