import { VIBE_HINTS } from '@/data/vibeHints';
import type { LandingLocale } from '@/i18n/locales';
import { arVibeHints } from '@/i18n/vibeHints/ar';
import { heVibeHints } from '@/i18n/vibeHints/he';
import { ruVibeHints } from '@/i18n/vibeHints/ru';

/** Vibe-hint catalogs keyed by landing locale (English is the SSOT). */
const VIBE_HINTS_BY_LOCALE: Record<LandingLocale, Readonly<Record<string, string>>> = {
  en: VIBE_HINTS,
  he: heVibeHints,
  ru: ruVibeHints,
  ar: arVibeHints,
};

/**
 * Resolve plain-language brand-mark vibe hints for a landing locale.
 * Falls back to English per key when a locale is missing a slug.
 *
 * @param locale - Active landing locale.
 * @returns Hint map for that locale (with English fallbacks).
 * @example
 * const hints = vibeHintsForLocale('he');
 * const line = hints.zed;
 */
export const vibeHintsForLocale = (locale: LandingLocale): Readonly<Record<string, string>> => {
  if (locale === 'en') {
    return VIBE_HINTS;
  }
  const localized = VIBE_HINTS_BY_LOCALE[locale];
  const merged: Record<string, string> = { ...VIBE_HINTS };
  for (const [slug, hint] of Object.entries(localized)) {
    if (hint.trim().length > 0) {
      merged[slug] = hint;
    }
  }
  return merged;
};

/**
 * Look up one vibe hint for a brand-mark slug in the active locale.
 *
 * @param locale - Active landing locale.
 * @param slug - Brand-mark slug (e.g. `zed`, `cursor`).
 * @returns Localized hint or undefined when unknown.
 * @example
 * const line = vibeHintFor('he', 'zed');
 */
export const vibeHintFor = (locale: LandingLocale, slug: string): string | undefined => {
  const local = VIBE_HINTS_BY_LOCALE[locale][slug];
  if (local !== undefined && local.trim().length > 0) {
    return local;
  }
  return VIBE_HINTS[slug];
};
