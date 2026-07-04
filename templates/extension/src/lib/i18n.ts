import enMessages from '../../public/_locales/en/messages.json' with { type: 'json' };
import { browser } from 'wxt/browser';

/** Languages that render right-to-left (the set VybeKiit ships with). */
const RTL_LANGUAGES = new Set(['ar', 'he', 'fa', 'ur']);

type LocaleEntry = {
  message: string;
  placeholders?: Record<string, { content: string }>;
};

const EN_MESSAGES = enMessages as Record<string, LocaleEntry>;

function applySubstitutions(message: string, substitutions?: string | string[]): string {
  const subs = Array.isArray(substitutions) ? substitutions : substitutions ? [substitutions] : [];
  let out = message;
  for (let i = 0; i < subs.length; i++) {
    // Chrome placeholder `$1$` → first sub — e.g. `"Hi $1$"` + `"Ada"` → `"Hi Ada"`
    out = out.replace(`$${i + 1}$`, subs[i] ?? '');
  }
  if (subs[0]) {
    // Named placeholder in `_locales` — e.g. `"Backend: $URL$"` + `"http://localhost:3000"`
    out = out.replace('$URL$', subs[0]);
  }
  return out;
}

function fallbackMessage(key: string, substitutions?: string | string[]): string | undefined {
  const entry = EN_MESSAGES[key];
  if (!entry?.message) return;
  return applySubstitutions(entry.message, substitutions);
}

/** Derive writing direction from the active Chrome UI locale. */
export function localeToDirection(locale: string): 'ltr' | 'rtl' {
  const base = locale.split('-')[0]?.toLowerCase() ?? 'en';
  return RTL_LANGUAGES.has(base) ? 'rtl' : 'ltr';
}

/** Active locale from the browser (Chrome i18n API). */
export function getActiveLocale(): string {
  try {
    return browser.i18n.getUILanguage().split('-')[0] ?? 'en';
  } catch {
    return 'en';
  }
}

/** Translate a flat-dotted message key via Chrome `_locales/`, with bundled English fallback. */
export function t(key: string, substitutions?: string | string[]): string {
  try {
    const i18nApi = browser.i18n as unknown as {
      getMessage: (messageName: string, substitutions?: string | string[]) => string;
    };
    const chromeMessage = i18nApi.getMessage(key, substitutions);
    if (chromeMessage) return chromeMessage;
  } catch {
    // Static preview / Playwright smoke tests — Chrome APIs are unavailable.
  }
  return fallbackMessage(key, substitutions) ?? key;
}
