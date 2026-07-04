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

/** Holds the global primary color: persisted to localStorage, applied to the chrome root. */
export function PreviewThemeProvider({ children }: { children: ReactNode }) {
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
}

export function usePreviewTheme(): PreviewThemeValue {
  const value = useContext(PreviewThemeContext);
  if (!value) {
    throw new Error('usePreviewTheme must be used within PreviewThemeProvider');
  }
  return value;
}
