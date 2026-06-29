/** Languages that render right-to-left (the set VybeKiit ships with). */
const RTL_LANGUAGES = new Set(['ar', 'he', 'fa', 'ur']);

/**
 * Derive page writing direction from the active i18n locale.
 * Combined with logical-property utilities (see `tailwind.config.ts`) the whole
 * layout mirrors with zero per-component work.
 */
export function localeToDirection(locale: string): 'ltr' | 'rtl' {
  const base = locale.split('-')[0]?.toLowerCase() ?? 'en';
  return RTL_LANGUAGES.has(base) ? 'rtl' : 'ltr';
}

/** Base language tag for `<html lang>` from a locale string. */
export function localeToLang(locale: string): string {
  return locale.split('-')[0]?.toLowerCase() ?? 'en';
}
