/**
 * Landing store locales: English, Hebrew, Russian, Arabic.
 * Hebrew and Arabic are RTL; the rest stay LTR.
 */

/** Supported marketing locales on vybekiit.com. */
export type LandingLocale = 'en' | 'he' | 'ru' | 'ar';

/** Locales that use right-to-left layout. */
const RTL_LOCALES = new Set<LandingLocale>(['he', 'ar']);

/** Ordered picker list (native names for the language button). */
export const LANDING_LOCALES = [
  { id: 'en' as const, nativeLabel: 'English', shortLabel: 'EN' },
  { id: 'he' as const, nativeLabel: 'עברית', shortLabel: 'HE' },
  { id: 'ru' as const, nativeLabel: 'Русский', shortLabel: 'RU' },
  { id: 'ar' as const, nativeLabel: 'العربية', shortLabel: 'AR' },
] as const;

/** Default locale when nothing is stored. */
export const DEFAULT_LANDING_LOCALE: LandingLocale = 'en';

/** localStorage key for the visitor language choice. */
export const LANDING_LOCALE_STORAGE_KEY = 'vybekiit.landing.locale';

/**
 * Whether a landing locale should render RTL.
 *
 * @param locale - Landing locale id.
 * @returns True for Hebrew and Arabic.
 * @example
 * const rtl = isLandingRtl('he');
 */
export const isLandingRtl = (locale: LandingLocale): boolean => RTL_LOCALES.has(locale);

/**
 * Narrow an unknown string to a supported landing locale.
 *
 * @param value - Candidate locale tag.
 * @returns Matching locale or null.
 * @example
 * const locale = parseLandingLocale('he');
 */
export const parseLandingLocale = (value: string | null | undefined): LandingLocale | null => {
  if (value === 'en' || value === 'he' || value === 'ru' || value === 'ar') {
    return value;
  }
  return null;
};
