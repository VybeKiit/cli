'use client';

import { PreviewThemeContext } from '@library/context/previewThemeContext';
import { applyPrimaryVars, DEFAULT_PRIMARY, PRIMARY_STORAGE_KEY } from '@library/lib/theme';
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

/**
 * Persist and apply the gallery primary color for live previews.
 *
 * @param props - Children to wrap with theme context.
 * @returns A React element for the component-library UI.
 * @example
 * const element = <PreviewThemeProvider><App /></PreviewThemeProvider>;
 */
export const PreviewThemeProvider = ({ children }: { children: ReactNode }) => {
  const [primary, setPrimaryState] = useState(DEFAULT_PRIMARY);

  useEffect(() => {
    const saved = window.localStorage.getItem(PRIMARY_STORAGE_KEY);
    if (saved) {
      setPrimaryState(saved);
    }
  }, []);

  useEffect(() => {
    applyPrimaryVars(document.documentElement, primary);
  }, [primary]);

  const setPrimary = useCallback((hex: string) => {
    setPrimaryState(hex);
    window.localStorage.setItem(PRIMARY_STORAGE_KEY, hex);
  }, []);

  const resetPrimary = useCallback(() => {
    setPrimaryState(DEFAULT_PRIMARY);
    window.localStorage.removeItem(PRIMARY_STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({ primary, setPrimary, resetPrimary }),
    [primary, setPrimary, resetPrimary],
  );

  return <PreviewThemeContext.Provider value={value}>{children}</PreviewThemeContext.Provider>;
};
