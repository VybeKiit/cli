'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  DEFAULT_LANDING_LOCALE,
  isLandingRtl,
  LANDING_LOCALE_STORAGE_KEY,
  type LandingLocale,
  parseLandingLocale,
} from '@/i18n/locales';
import { messagesForLocale } from '@/i18n/messages';
import type { LandingMessages } from '@/i18n/messages/types';

interface LocaleContextValue {
  readonly locale: LandingLocale;
  readonly messages: LandingMessages;
  readonly dir: 'ltr' | 'rtl';
  readonly setLocale: (locale: LandingLocale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * Apply lang + dir on the document root so logical CSS mirrors for RTL.
 *
 * @param locale - Active landing locale.
 */
const applyDocumentLocale = (locale: LandingLocale): void => {
  const root = document.documentElement;
  root.lang = locale;
  root.dir = isLandingRtl(locale) ? 'rtl' : 'ltr';
};

/**
 * Read a previously chosen locale from localStorage (client only).
 *
 * @returns Stored locale or null.
 */
const readStoredLocale = (): LandingLocale | null => {
  try {
    return parseLandingLocale(globalThis.localStorage?.getItem(LANDING_LOCALE_STORAGE_KEY));
  } catch {
    return null;
  }
};

interface LocaleProviderProps {
  readonly children: ReactNode;
}

/**
 * Client locale provider for the marketing site. Default is English; after
 * mount it hydrates from localStorage and updates `html` lang/dir.
 *
 * @param props - React children.
 * @returns Provider wrapping the marketing tree.
 * @example
 * <LocaleProvider><App /></LocaleProvider>
 */
export const LocaleProvider = ({ children }: LocaleProviderProps) => {
  const [locale, setLocaleState] = useState<LandingLocale>(DEFAULT_LANDING_LOCALE);

  useEffect(() => {
    const stored = readStoredLocale();
    if (stored !== null) {
      setLocaleState(stored);
      applyDocumentLocale(stored);
      return;
    }
    applyDocumentLocale(DEFAULT_LANDING_LOCALE);
  }, []);

  const setLocale = useCallback((next: LandingLocale) => {
    setLocaleState(next);
    applyDocumentLocale(next);
    try {
      globalThis.localStorage?.setItem(LANDING_LOCALE_STORAGE_KEY, next);
    } catch {
      // Private mode / blocked storage — still switch for this session.
    }
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      messages: messagesForLocale(locale),
      dir: isLandingRtl(locale) ? 'rtl' : 'ltr',
      setLocale,
    }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
};

/**
 * Access the active landing locale and message catalog.
 *
 * @returns Locale context value.
 * @throws When used outside LocaleProvider.
 * @example
 * const { messages, setLocale } = useLandingLocale();
 */
export const useLandingLocale = (): LocaleContextValue => {
  const ctx = useContext(LocaleContext);
  if (ctx === null) {
    throw new Error('useLandingLocale must be used within LocaleProvider');
  }
  return ctx;
};
