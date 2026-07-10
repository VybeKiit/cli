'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ReactNode } from 'react';

interface ThemeProviderProps {
  readonly children: ReactNode;
}

/**
 * Class-based theme provider for the visitor marketing shell.
 * Default is light; the navbar toggle switches `html.dark` without following OS.
 *
 * `disableTransitionOnChange` is required for snappy toggles: next-themes
 * briefly suppresses CSS transitions while flipping the class so every
 * `transition: color/background` on the page does not animate together.
 *
 * @param props - Provider children.
 * @returns Themed children.
 * @example
 * <ThemeProvider><SiteHeader /></ThemeProvider>
 */
export const ThemeProvider = ({ children }: ThemeProviderProps) => (
  <NextThemesProvider
    attribute="class"
    defaultTheme="light"
    disableTransitionOnChange={true}
    enableSystem={false}
  >
    {children}
  </NextThemesProvider>
);
