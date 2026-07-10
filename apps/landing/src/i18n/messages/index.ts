import type { LandingLocale } from '@/i18n/locales';
import { arMessages } from '@/i18n/messages/ar';
import { enMessages } from '@/i18n/messages/en';
import { heMessages } from '@/i18n/messages/he';
import { ruMessages } from '@/i18n/messages/ru';
import type { LandingMessages } from '@/i18n/messages/types';

/** Full message map for every supported landing locale. */
export const LANDING_MESSAGES: Record<LandingLocale, LandingMessages> = {
  en: enMessages,
  he: heMessages,
  ru: ruMessages,
  ar: arMessages,
};

/**
 * Resolve messages for a landing locale.
 *
 * @param locale - Landing locale id.
 * @returns Message catalog for that locale.
 * @example
 * const messages = messagesForLocale('he');
 */
export const messagesForLocale = (locale: LandingLocale): LandingMessages =>
  LANDING_MESSAGES[locale];
