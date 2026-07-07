'use client';

import { ComponentCard } from '@library/components/ComponentCard';
import { ComponentSelectCheckbox } from '@library/components/ComponentSelectCheckbox';
import { CopyPromptButton } from '@library/components/CopyPromptButton';
import { PreviewControlsBar, SIZE_SCALES } from '@library/components/PreviewControlsBar';
import { PreviewDeviceFrame } from '@library/components/PreviewDeviceFrame';
import { PreviewLoadingOverlay } from '@library/components/PreviewLoadingSpinner';
import { usePreviewTheme } from '@library/components/PreviewThemeProvider';
import { SelectionTray } from '@library/components/SelectionTray';
import { useCatalogGridLayout } from '@library/context/CatalogGridLayoutContext';
import {
  CATALOG_BY_CATEGORY,
  type CatalogEntry,
  type UnavailableReason,
} from '@library/data/catalog';
import { usePreviewLoaded } from '@library/hooks/usePreviewLoaded';
import { categoryLabelFromSlug } from '@library/lib/categoryLabels';
import { markPreviewLoaded } from '@library/lib/previewCache';
import { postPreviewTheme } from '@library/lib/previewMessaging';
import {
  loadCustomViewportWidth,
  loadPreviewSize,
  loadViewportPreset,
  type PreviewSize,
  resolveViewportWidth,
  saveCustomViewportWidth,
  savePreviewSize,
  saveViewportPreset,
  type ViewportPreset,
} from '@library/lib/previewViewport';
import { buildPreviewSrc, type PreviewMode } from '@library/lib/theme';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/** Honest, buyer-facing copy for why a component can't render live in the gallery. */
const UNAVAILABLE_COPY: Record<UnavailableReason, string> = {
  env: 'This example needs API keys or a live backend. Import it into your app to run it there.',
  deps: 'This component needs extra packages the starter does not install by default. Copy the source above and ask your agent to add its dependencies.',
  native:
    'This is a native or WebGL component. It renders inside your app, not in the isolated gallery preview.',
  nodemo: 'Live preview is coming soon. The source above is ready to copy into your app.',
};

const reasonOf = (entry: CatalogEntry): UnavailableReason => {
  if (entry.unavailableReason !== undefined) {
    return entry.unavailableReason;
  }
  return entry.requiresEnv ? 'env' : 'nodemo';
};

const PREVIEW_BASE_HEIGHT = 520;

const PreviewIframe = ({
  entry,
  mode,
  primary,
  viewportWidth,
  viewport,
  sizeScale,
}: {
  entry: CatalogEntry;
  mode: PreviewMode;
  primary: string;
  viewportWidth: string;
  sizeScale: number;
  viewport: ViewportPreset;
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const src = buildPreviewSrc(entry.namespace, entry.name);
  const wasLoaded = usePreviewLoaded(entry.previewKey);
  const [showSpinner, setShowSpinner] = useState(!wasLoaded);
  const scaledHeight = PREVIEW_BASE_HEIGHT * sizeScale;

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset the spinner when the previewed entry changes
  useEffect(() => {
    setShowSpinner(!wasLoaded);
  }, [wasLoaded, entry.previewKey]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) {
      return;
    }
    const applyTheme = () => postPreviewTheme(iframe, mode, primary);
    iframe.addEventListener('load', applyTheme);
    applyTheme();
    return () => iframe.removeEventListener('load', applyTheme);
  }, [mode, primary]);

  return (
    <div className="relative mx-auto w-full overflow-hidden rounded-lg border border-border bg-muted/20">
      {showSpinner ? <PreviewLoadingOverlay className="absolute inset-0 z-10" /> : null}
      <PreviewDeviceFrame viewport={viewport}>
        <div
          className="mx-auto overflow-hidden transition-[height,width] duration-300 ease-in-out"
          style={{ height: scaledHeight, maxWidth: '100%', width: viewportWidth }}
        >
          <div
            className="origin-top transition-transform duration-300 ease-in-out"
            style={{
              height: PREVIEW_BASE_HEIGHT,
              transform: `scale(${sizeScale})`,
              width: viewportWidth === '100%' ? '100%' : viewportWidth,
            }}
          >
            <iframe
              className="w-full rounded-lg border-0 bg-background"
              loading="lazy"
              onLoad={() => {
                markPreviewLoaded(entry.previewKey);
                setShowSpinner(false);
                postPreviewTheme(iframeRef.current, mode, primary);
              }}
              ref={iframeRef}
              src={src}
              style={{ height: PREVIEW_BASE_HEIGHT }}
              title={`Preview ${entry.name}`}
            />
          </div>
        </div>
      </PreviewDeviceFrame>
    </div>
  );
};

/**
 * Render the component detail component.
 *
 * @param props - Props passed to this component.
 * @returns A React element for the component-library UI.
 * @example
 * const element = <ComponentDetail {...props} />;
 */
export const ComponentDetail = ({ entry }: { entry: CatalogEntry }) => {
  const { resolvedTheme } = useTheme();
  const { primary } = usePreviewTheme();
  const { gridClassName } = useCatalogGridLayout();
  const [modeOverride, setModeOverride] = useState<PreviewMode | null>(null);
  const [mounted, setMounted] = useState(false);
  const [viewport, setViewport] = useState<ViewportPreset>('desktop');
  const [customWidth, setCustomWidth] = useState(960);
  const [size, setSize] = useState<PreviewSize>('l');

  useEffect(() => {
    setMounted(true);
    setViewport(loadViewportPreset());
    setCustomWidth(loadCustomViewportWidth());
    setSize(loadPreviewSize());
  }, []);

  const mode: PreviewMode =
    modeOverride === null ? (resolvedTheme === 'dark' ? 'dark' : 'light') : modeOverride;
  const viewportWidth = resolveViewportWidth(viewport, customWidth);
  const sizeScale = SIZE_SCALES[size];

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
              <span className="rounded bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
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
              onCustomWidthChange={(width) => {
                setCustomWidth(width);
                saveCustomViewportWidth(width);
              }}
              onModeChange={setModeOverride}
              onSizeChange={(next) => {
                setSize(next);
                savePreviewSize(next);
              }}
              onViewportChange={(next) => {
                setViewport(next);
                saveViewportPreset(next);
              }}
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
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center text-muted-foreground text-sm">
          <p className="max-w-md">{UNAVAILABLE_COPY[reasonOf(entry)]}</p>
          {reasonOf(entry) === 'nodemo' ? (
            <Link className="text-primary underline underline-offset-2" href="/?tab=examples">
              Browse the Examples tab for related demos
            </Link>
          ) : null}
        </div>
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
