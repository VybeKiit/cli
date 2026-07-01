import { useMemo } from 'react';
import { t as translate } from '@/lib/i18n';

/** Hook wrapper for screen components — returns the catalog `t()` helper. */
export function useTranslations() {
  return useMemo(
    () => ({
      t: (key: string, options?: Record<string, string | number>) => translate(key, options),
    }),
    [],
  );
}

/** Show a catalog key or pass through a server error message. */
export function displayError(t: ReturnType<typeof useTranslations>['t'], error: string): string {
  const translated = translate(error, {});
  return translated === `[missing "${error}" translation]` ? error : translated;
}
