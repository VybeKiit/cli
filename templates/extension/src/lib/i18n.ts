import enMessages from '../../public/_locales/en/messages.json' with { type: 'json' };
import { browser } from 'wxt/browser';

/** Languages that render right-to-left (the set VybeKiit ships with). */
const RTL_LANGUAGES = new Set(['ar', 'he', 'fa', 'ur']);

type LocaleEntry = {
  message: string;
  placeholders?: Record<string, { content: string }>;
};

const EN_MESSAGES = enMessages as Record<string, LocaleEntry>;

/**
 * Apply Chrome i18n positional and named substitutions to a message.
 *
 * @param message - Message string from Chrome or the bundled fallback catalog.
 * @param substitutions - Optional Chrome i18n substitutions.
 * @returns Message with placeholders replaced.
 * @example
 * const text = applySubstitutions('Hi $1$', 'Ada');
 */
const applySubstitutions = (message: string, substitutions?: string | string[]): string => {
  const subs = Array.isArray(substitutions) ? substitutions : substitutions ? [substitutions] : [];
  let out = message;
  for (let i = 0; i < subs.length; i++) {
    const substitution = subs[i];
    // Chrome placeholder `$1$` -> first sub, e.g. `"Hi $1$"` + `"Ada"` -> `"Hi Ada"`
    out = out.replace(`$${i + 1}$`, substitution === undefined ? '' : substitution);
  }
  if (subs[0]) {
    // Named placeholder in `_locales`, e.g. `"Backend: $URL$"` + `"http://localhost:3000"`
    out = out.replace('$URL$', subs[0]);
  }
  return out;
};

/**
 * Resolve a message from the bundled English catalog.
 *
 * @param key - Chrome `_locales` message key.
 * @param substitutions - Optional Chrome i18n substitutions.
 * @returns The fallback message, or undefined when the key is missing.
 * @example
 * const label = fallbackMessage('nav_home');
 */
const fallbackMessage = (key: string, substitutions?: string | string[]): string | undefined => {
  const entry = EN_MESSAGES[key];
  if (entry === undefined || entry.message.length === 0) {
    return;
  }
  return applySubstitutions(entry.message, substitutions);
};

/**
 * Derive writing direction from the active Chrome UI locale.
 *
 * @param locale - BCP-47 locale string such as `en-US` or `he-IL`.
 * @returns The layout direction the extension should use.
 * @example
 * const dir = localeToDirection('he-IL');
 */
export const localeToDirection = (locale: string): 'ltr' | 'rtl' => {
  const [language] = locale.split('-');
  const base = language === undefined || language.length === 0 ? 'en' : language.toLowerCase();
  return RTL_LANGUAGES.has(base) ? 'rtl' : 'ltr';
};

/**
 * Read the active locale from the browser.
 *
 * @returns Chrome UI language, or `en` when the API is unavailable.
 * @example
 * const locale = getActiveLocale();
 */
export const getActiveLocale = (): string => {
  try {
    const [language] = browser.i18n.getUILanguage().split('-');
    return language === undefined || language.length === 0 ? 'en' : language;
  } catch {
    return 'en';
  }
};

/**
 * Translate a message key via Chrome `_locales`, with bundled English fallback.
 *
 * @param key - Chrome `_locales` message key.
 * @param substitutions - Optional Chrome i18n substitutions.
 * @returns Translated message or the key when no catalog has it.
 * @example
 * const label = t('nav_home');
 */
export const t = (key: string, substitutions?: string | string[]): string => {
  try {
    const i18nApi = browser.i18n as unknown as {
      getMessage: (messageName: string, substitutions?: string | string[]) => string;
    };
    const chromeMessage = i18nApi.getMessage(key, substitutions);
    if (chromeMessage.length > 0) {
      return chromeMessage;
    }
  } catch {
    // Static preview / Playwright smoke tests — Chrome APIs are unavailable.
  }
  const fallback = fallbackMessage(key, substitutions);
  return fallback === undefined ? key : fallback;
};
