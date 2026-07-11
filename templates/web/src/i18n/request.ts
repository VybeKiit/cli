import type { AbstractIntlMessages } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

/** Flat `messages/en.json` keys use dots — next-intl expects nested objects. */
const nestFlatMessages = (flat: Record<string, string>): AbstractIntlMessages => {
  const out: Record<string, unknown> = {};
  // Nesting flow for each flat key (e.g. `nav.home` → { nav: { home: "…" } }):
  // 1. Outer loop: every flat key/value from the locale JSON.
  // 2. Split on `.` into path segments.
  // 3. Inner loop: walk/create intermediate objects for every segment except the leaf.
  // 4. Write the string value on the leaf segment.
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.');
    let cursor = out;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (part === undefined) {
        throw new Error(`Invalid empty message key segment for "${key}".`);
      }
      const existing = cursor[part];
      if (typeof existing !== 'object' || existing === null) {
        cursor[part] = {};
      }
      cursor = cursor[part] as Record<string, unknown>;
    }
    const leaf = parts.at(-1);
    if (leaf === undefined) {
      throw new Error('Message keys must not be empty.');
    }
    cursor[leaf] = value;
  }
  return out as AbstractIntlMessages;
};

/** Request-scoped next-intl config that resolves locale messages for server components. */
const requestConfig = getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;
  const resolved =
    locale !== undefined && routing.locales.includes(locale as (typeof routing.locales)[number])
      ? locale
      : routing.defaultLocale;

  const flat = (await import(`../../messages/${resolved}.json`)).default as Record<string, string>;

  return {
    locale: resolved,
    messages: nestFlatMessages(flat),
  };
});

export default requestConfig;
