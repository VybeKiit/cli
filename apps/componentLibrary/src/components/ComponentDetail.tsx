'use client';

import { ComponentCard } from '@library/components/ComponentCard';
import { ComponentSelectCheckbox } from '@library/components/ComponentSelectCheckbox';
import { CopyPromptButton } from '@library/components/CopyPromptButton';
import { PreviewControlsBar } from '@library/components/PreviewControlsBar';
import { PreviewIframe } from '@library/components/PreviewIframe';
import { SelectionTray } from '@library/components/SelectionTray';
import { PageContainer } from '@library/components/shell/PageContainer';
import { PageHeader } from '@library/components/shell/PageHeader';
import { useCatalogGridLayout } from '@library/context/CatalogGridLayoutContext';
import type { CatalogEntry } from '@library/data/catalog';
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
  readonly related: readonly CatalogEntry[];
}

/**
 * Component detail page: live preview, related cards, and selection tray.
 *
 * @param props - Catalog entry to display, plus its server-computed related entries.
 * @returns A React element for the component-library detail route.
 * @example
 * const element = <ComponentDetail entry={entry} related={related} />;
 */
export const ComponentDetail = ({ entry, related }: ComponentDetailProps) => {
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

  return (
    <PageContainer size="default">
      <PageHeader
        actions={
          <>
            <CopyPromptButton entry={entry} />
            <ComponentSelectCheckbox compact={false} previewKey={entry.previewKey} />
          </>
        }
        backLink={{ href: '/', label: 'Back to catalog' }}
        eyebrow={
          <>
            <p className="font-medium text-muted-foreground text-xs uppercase">{entry.namespace}</p>
            <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {categoryLabelFromSlug(entry.category)}
            </span>
          </>
        }
        title={entry.name}
      >
        <code className="mt-2 block rounded bg-muted px-2 py-1 font-mono text-sm">
          {entry.importPath}
        </code>
      </PageHeader>
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
      {related.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-4 font-semibold text-lg">
            More in {categoryLabelFromSlug(entry.category)}
          </h2>
          <div className={cn('grid gap-4', gridClassName)}>
            {related.map((item) => (
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
    </PageContainer>
  );
};
