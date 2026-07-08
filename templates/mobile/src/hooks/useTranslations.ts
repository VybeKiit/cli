import { t as translate } from '@/lib/i18n';
import { useMemo } from 'react';

/**
 * Return the memoized translation helper for screen components.
 *
 * @returns Object containing the active catalog translator.
 * @example
 * const { t } = useTranslations();
 */
export const useTranslations = () =>
  useMemo(
    () => ({
      t: (key: string, options?: Record<string, string | number>) => translate(key, options),
    }),
    [],
  );

/**
 * Show a catalog key or pass through a server error message.
 *
 * @param t - Translation helper returned by {@link useTranslations}.
 * @param error - Catalog key or server-provided message.
 * @returns User-facing error text.
 * @example
 * const message = displayError(t, 'auth.errors.required');
 */
export const displayError = (t: ReturnType<typeof useTranslations>['t'], error: string): string => {
  const translated = t(error, {});
  return translated === `[missing "${error}" translation]` ? error : translated;
};
