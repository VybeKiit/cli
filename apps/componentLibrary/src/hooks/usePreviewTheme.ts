'use client';

import { PreviewThemeContext, type PreviewThemeValue } from '@library/context/previewThemeContext';
import { useContext } from 'react';

/**
 * Read preview theme state for the component library.
 *
 * @returns Primary color state and setters from PreviewThemeProvider.
 * @throws When used outside PreviewThemeProvider.
 * @example
 * const { primary, setPrimary } = usePreviewTheme();
 */
export const usePreviewTheme = (): PreviewThemeValue => {
  const value = useContext(PreviewThemeContext);
  if (!value) {
    throw new Error('usePreviewTheme must be used within PreviewThemeProvider');
  }
  return value;
};
