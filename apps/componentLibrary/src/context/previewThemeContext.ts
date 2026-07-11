'use client';

import { createContext } from 'react';

export interface PreviewThemeValue {
  readonly primary: string;
  readonly setPrimary: (hex: string) => void;
  readonly resetPrimary: () => void;
}

/** React context for the gallery primary-color theme. */
export const PreviewThemeContext = createContext<PreviewThemeValue | null>(null);
