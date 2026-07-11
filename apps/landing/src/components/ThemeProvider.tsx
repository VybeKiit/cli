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
 * `disableTransitionOnChange` stays on so individual elements do not all tween
 * color at once. The soft page fade is handled by the View Transitions API in
 * `ThemeToggle` instead.
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
