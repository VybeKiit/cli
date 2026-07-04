import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

/** Flat `messages/en.json` keys use dots — next-intl expects nested objects. */
function nestFlatMessages(flat: Record<string, string>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.');
    let cursor = out;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]!;
      const existing = cursor[part];
      if (typeof existing !== 'object' || existing === null) {
        cursor[part] = {};
      }
      cursor = cursor[part] as Record<string, unknown>;
    }
    cursor[parts[parts.length - 1]!] = value;
  }
  return out;
}

export default getRequestConfig(async ({ locale }) => {
  const resolved = routing.locales.includes(locale as (typeof routing.locales)[number])
    ? locale
    : routing.defaultLocale;

  const flat = (await import(`../../messages/${resolved}.json`)).default as Record<string, string>;

  return {
    locale: resolved,
    messages: nestFlatMessages(flat),
  };
});
