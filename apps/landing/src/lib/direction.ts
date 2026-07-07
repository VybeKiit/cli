/** Languages that render right-to-left (the set VybeKiit ships with). */
const RTL_LANGUAGES = new Set(['ar', 'he', 'fa', 'ur']);

/** Resolved page language + writing direction for the root `<html>` element. */
export interface Direction {
  readonly lang: string;
  readonly dir: 'ltr' | 'rtl';
}

/**
 * Pick the page direction from an `Accept-Language` header. RTL is free if it's decided once, at the root, from the visitor's own locale — combined with logical-property utilities (see `tailwind.config.ts`) the whole layout mirrors with zero per-component work. Falls back to English/LTR.
 *
 * @param acceptLanguage - Input value.
 * @returns The computed result.
 * @example
 * const result = resolveDirection(acceptLanguage);
 */

export const resolveDirection = (acceptLanguage: string | null): Direction => {
  const firstLanguage = acceptLanguage === null ? undefined : acceptLanguage.split(',')[0];
  const primary = firstLanguage === undefined ? 'en' : firstLanguage.trim().toLowerCase();
  const firstSegment = primary.split('-')[0];
  const base = firstSegment === undefined ? 'en' : firstSegment;
  return { lang: base, dir: RTL_LANGUAGES.has(base) ? 'rtl' : 'ltr' };
};
