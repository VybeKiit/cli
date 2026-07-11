import type { LandingLocale } from '@/i18n/locales';
import { arRecipeTitles } from '@/i18n/pageRecipes/ar';
import { enRecipeTitles } from '@/i18n/pageRecipes/en';
import { heRecipeTitles } from '@/i18n/pageRecipes/he';
import { ruRecipeTitles } from '@/i18n/pageRecipes/ru';

export type RecipeTitleEntry = {
  readonly title: string;
  readonly blurb?: string;
};

const BY_LOCALE: Record<LandingLocale, Readonly<Record<string, RecipeTitleEntry>>> = {
  en: enRecipeTitles,
  he: heRecipeTitles,
  ru: ruRecipeTitles,
  ar: arRecipeTitles,
};

/**
 * Localized title (and optional blurb) for a page-recipe card.
 *
 * @param locale - Active landing locale.
 * @param id - Recipe id from PAGE_RECIPE_PREVIEWS.
 * @returns Localized entry, falling back to English.
 * @example
 * const { title } = recipeTitleFor('he', 'checkout');
 */
export const recipeTitleFor = (locale: LandingLocale, id: string): RecipeTitleEntry => {
  const local = BY_LOCALE[locale][id];
  if (local !== undefined) {
    return local;
  }
  return enRecipeTitles[id] ?? { title: id };
};
