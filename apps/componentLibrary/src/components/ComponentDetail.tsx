'use client';

import { ComponentCard } from '@library/components/ComponentCard';
import { ComponentSelectCheckbox } from '@library/components/ComponentSelectCheckbox';
import { CopyPromptButton } from '@library/components/CopyPromptButton';
import { PreviewControlsBar } from '@library/components/PreviewControlsBar';
import { PreviewIframe } from '@library/components/PreviewIframe';
import { SelectionTray } from '@library/components/SelectionTray';
import { useCatalogGridLayout } from '@library/context/CatalogGridLayoutContext';
import { CATALOG_BY_CATEGORY, type CatalogEntry } from '@library/data/catalog';
import { usePreviewTheme } from '@library/hooks/usePreviewTheme';
import { usePreviewViewportState } from '@library/hooks/usePreviewViewportState';
import { categoryLabelFromSlug } from '@library/lib/categoryLabels';
import { SIZE_SCALES } from '@library/lib/previewViewport';
import { UNAVAILABLE_COPY, unavailableReasonOf } from '@library/lib/unavailableReasons';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader } from '@vybekiit/ui/empty';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ComponentDetailProps {
  readonly entry: CatalogEntry;
}

/**
 * Component detail page: live preview, related cards, and selection tray.
 *
 * @param props - Catalog entry to display.
 * @returns A React element for the component-library detail route.
 * @example
 * const element = <ComponentDetail entry={entry} />;
 */
export const ComponentDetail = ({ entry }: ComponentDetailProps) => {
  const { primary } = usePreviewTheme();
  const { gridClassName } = useCatalogGridLayout();
  const {
    mounted,
    mode,
    setModeOverride,
    viewport,
    customWidth,
    size,
    viewportWidth,
    persistViewport,
    persistCustomWidth,
    persistSize,
  } = usePreviewViewportState();

  const sizeScale = SIZE_SCALES[size];
  const reason = unavailableReasonOf(entry);

  const categoryEntries = CATALOG_BY_CATEGORY[entry.category];
  const relatedInCategory = (categoryEntries === undefined ? [] : categoryEntries)
    .filter((item) => item.previewKey !== entry.previewKey)
    .sort((a, b) => Number(b.previewable) - Number(a.previewable))
    .slice(0, 8);

  return (
    <div className="mx-auto max-w-5xl p-6 pb-24 md:p-8">
      <Link className="text-muted-foreground text-sm hover:text-foreground" href="/">
        ← Back to catalog
      </Link>
      <header className="mt-4 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-muted-foreground text-xs uppercase">
                {entry.namespace}
              </p>
              <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {categoryLabelFromSlug(entry.category)}
              </span>
            </div>
            <h1 className="font-bold text-2xl">{entry.name}</h1>
            <code className="mt-2 block rounded bg-muted px-2 py-1 font-mono text-sm">
              {entry.importPath}
            </code>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <CopyPromptButton entry={entry} />
            <ComponentSelectCheckbox compact={false} previewKey={entry.previewKey} />
          </div>
        </div>
      </header>
      {entry.previewable ? (
        <div className="flex flex-col gap-3">
          {mounted ? (
            <PreviewControlsBar
              customWidth={customWidth}
              mode={mode}
              onCustomWidthChange={persistCustomWidth}
              onModeChange={setModeOverride}
              onSizeChange={persistSize}
              onViewportChange={persistViewport}
              size={size}
              viewport={viewport}
            />
          ) : null}
          <PreviewIframe
            entry={entry}
            mode={mode}
            primary={primary}
            sizeScale={sizeScale}
            viewport={viewport}
            viewportWidth={viewportWidth}
          />
        </div>
      ) : (
        <Empty variant="dashed">
          <EmptyHeader>
            <EmptyDescription>{UNAVAILABLE_COPY[reason]}</EmptyDescription>
          </EmptyHeader>
          {reason === 'nodemo' ? (
            <EmptyContent>
              <Link className="text-primary underline underline-offset-2" href="/?tab=examples">
                Browse the Examples tab for related demos
              </Link>
            </EmptyContent>
          ) : null}
        </Empty>
      )}
      {relatedInCategory.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-4 font-semibold text-lg">
            More in {categoryLabelFromSlug(entry.category)}
          </h2>
          <div className={cn('grid gap-4', gridClassName)}>
            {relatedInCategory.map((item) => (
              <ComponentCard
                entry={item}
                href={`/components/${item.namespace}/${encodeURIComponent(item.name)}`}
                key={item.previewKey}
              />
            ))}
          </div>
        </section>
      ) : null}
      <SelectionTray />
    </div>
  );
};
