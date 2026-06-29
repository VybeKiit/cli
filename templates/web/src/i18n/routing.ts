/** Supported locales — add new codes via the `add-language` skill. */
export const locales = ['en'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

/** Routing config consumed by middleware and navigation helpers. */
export const routing = {
  locales,
  defaultLocale,
} as const;
