'use client';

import { CardPreview } from '@library/components/CardPreview';
import type { CatalogEntry } from '@library/data/catalog';
import type { PreviewMode } from '@library/lib/theme';
import { useTheme } from 'next-themes';
import { memo } from 'react';

interface CardPreviewWithThemeProps {
  readonly entry: CatalogEntry;
}

/**
 * Resolve chrome theme into a preview mode and render {@link CardPreview}.
 *
 * @param props - Catalog entry for the card preview.
 * @returns A themed card preview element.
 * @example
 * const element = <CardPreviewWithTheme entry={entry} />;
 */
export const CardPreviewWithTheme = memo(({ entry }: CardPreviewWithThemeProps) => {
  const { resolvedTheme } = useTheme();
  const previewMode: PreviewMode = resolvedTheme === 'dark' ? 'dark' : 'light';
  return <CardPreview entry={entry} mode={previewMode} />;
});
CardPreviewWithTheme.displayName = 'CardPreviewWithTheme';
