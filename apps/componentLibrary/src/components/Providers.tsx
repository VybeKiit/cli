'use client';

import { LayoutTooltipProvider } from '@library/components/layout/LayoutTooltip';
import { PreviewThemeProvider } from '@library/components/PreviewThemeProvider';
import { CatalogDataProvider } from '@library/context/CatalogDataContext';
import { CatalogGridLayoutProvider } from '@library/context/CatalogGridLayoutContext';
import { SelectionProvider } from '@library/context/SelectionContext';
import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';

/**
 * Render the providers component.
 *
 * @param props - Props passed to this component.
 * @returns A React element for the component-library UI.
 * @example
 * const element = <Providers><App /></Providers>;
 */
export const Providers = ({ children }: { children: ReactNode }) => (
  <ThemeProvider
    attribute="class"
    defaultTheme="system"
    enableSystem={true}
    disableTransitionOnChange={true}
  >
    <LayoutTooltipProvider>
      <CatalogDataProvider>
        <CatalogGridLayoutProvider>
          <PreviewThemeProvider>
            <SelectionProvider>{children}</SelectionProvider>
          </PreviewThemeProvider>
        </CatalogGridLayoutProvider>
      </CatalogDataProvider>
    </LayoutTooltipProvider>
  </ThemeProvider>
);
