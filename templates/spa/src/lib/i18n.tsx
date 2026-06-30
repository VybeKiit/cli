import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { resolveI18nProvider } from '@vybekiit/i18n';
import en from '../../messages/en.json';

type Messages = typeof en;

interface I18nContextValue {
  locale: string;
  dir: 'ltr' | 'rtl';
  t: (key: keyof Messages | string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const i18nProvider = resolveI18nProvider();

export function I18nProvider({ children }: { children: ReactNode }) {
  const value = useMemo<I18nContextValue>(() => {
    const locale = i18nProvider.resolveLocale();
    return {
      locale,
      dir: i18nProvider.isRtl(locale) ? 'rtl' : 'ltr',
      t: (key) => {
        const k = key as keyof Messages;
        return en[k] ?? String(key);
      },
    };
  }, []);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
