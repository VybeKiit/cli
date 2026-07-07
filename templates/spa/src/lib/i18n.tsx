import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { isRtlLocale, resolveLocaleOrDefault } from '@vybekiit/i18n/localeRules';
import en from '../../messages/en.json' with { type: 'json' };

type Messages = typeof en;

interface I18nContextValue {
  readonly dir: 'ltr' | 'rtl';
  readonly locale: string;
  readonly t: (key: keyof Messages | string) => string;
}

interface I18nProviderProps {
  readonly children?: ReactNode;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const DEFAULT_LOCALE = 'en';

/**
 * Provides translated SPA copy and text direction.
 *
 * @param props - Provider props.
 * @returns An i18n context provider wrapping the supplied children.
 * @example
 * ```tsx
 * <I18nProvider>
 *   <App />
 * </I18nProvider>
 * ```
 */
export const I18nProvider = ({ children = null }: I18nProviderProps) => {
  const value = useMemo<I18nContextValue>(() => {
    const locale = resolveLocaleOrDefault(undefined, DEFAULT_LOCALE);
    return {
      locale,
      dir: isRtlLocale(locale) ? 'rtl' : 'ltr',
      t: (key) => {
        const k = key as keyof Messages;
        const message = en[k];
        return message === undefined ? String(key) : message;
      },
    };
  }, []);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

/**
 * Reads the current SPA i18n context.
 *
 * @returns The active locale, direction, and translation helper.
 * @example
 * const { t } = useI18n();
 */
export const useI18n = (): I18nContextValue => {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
};
