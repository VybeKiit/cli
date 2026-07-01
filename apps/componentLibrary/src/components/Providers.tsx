'use client';

import { PreviewThemeProvider } from '@library/components/PreviewThemeProvider';
import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={true}
      disableTransitionOnChange={true}
    >
      <PreviewThemeProvider>{children}</PreviewThemeProvider>
    </ThemeProvider>
  );
}
