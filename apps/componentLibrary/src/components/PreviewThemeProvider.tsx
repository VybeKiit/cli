'use client';

import { applyPrimaryVars, DEFAULT_PRIMARY, PRIMARY_STORAGE_KEY } from '@library/lib/theme';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

interface PreviewThemeValue {
  readonly primary: string;
  readonly setPrimary: (hex: string) => void;
  readonly resetPrimary: () => void;
}

const PreviewThemeContext = createContext<PreviewThemeValue | null>(null);

/**
 * Render the preview theme provider component.
 *
 * @param props - Props passed to this component.
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

/**
 * Read preview theme state for the component library.
 *
 * @returns The state or callback exposed by usePreviewTheme.
 * @example
 * const value = usePreviewTheme();
 */
export const usePreviewTheme = (): PreviewThemeValue => {
  const value = useContext(PreviewThemeContext);
  if (!value) {
    throw new Error('usePreviewTheme must be used within PreviewThemeProvider');
  }
  return value;
};
