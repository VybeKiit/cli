'use client';

import { ComponentSelectCheckbox } from '@library/components/ComponentSelectCheckbox';
import { CopyPromptButton } from '@library/components/CopyPromptButton';
import { PreviewLoadingOverlay } from '@library/components/PreviewLoadingSpinner';
import { usePreviewTheme } from '@library/components/PreviewThemeProvider';
import type { CatalogEntry, UnavailableReason } from '@library/data/catalog';
import { usePreviewLoaded } from '@library/hooks/usePreviewLoaded';
import { categoryLabelFromSlug } from '@library/lib/categoryLabels';
import { markPreviewLoaded } from '@library/lib/previewCache';
import { acquirePreviewLoadSlot } from '@library/lib/previewLoadQueue';
import { postPreviewTheme } from '@library/lib/previewMessaging';
import { buildPreviewSrc, type PreviewMode } from '@library/lib/theme';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { type MouseEvent, memo, useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const SOURCE_LABELS: Record<string, string> = {
  bundui: 'BundUI',
  magicui: 'Magic UI',
  kokonutui: 'Kokonut',
  aceternity: 'Aceternity',
  untitled: 'Untitled',
  gluestack: 'Gluestack',
  'ai-elements': 'AI Elements',
  kibo: 'Kibo UI',
  'blocks-21st': '21st.dev',
  tailark: 'Tailark',
  cult: 'Cult UI',
  coss: 'COSS UI',
  'prompt-kit': 'Prompt Kit',
  supabase: 'Supabase UI',
  'blocks-so': 'Blocks.so',
  evilcharts: 'EvilCharts',
  shadcnblocks: 'Shadcnblocks',
  vybekiit: 'VybeKiit',
};

const UNAVAILABLE_CHIP: Record<UnavailableReason, string> = {
  env: 'Needs API key',
  deps: 'Needs deps',
  native: 'Native only',
  nodemo: 'No preview',
};

const sourceLabelFor = (namespace: string): string => {
  const label = SOURCE_LABELS[namespace];
  if (label === undefined) {
    return namespace;
  }
  return label;
};

interface ComponentCardProps {
  readonly entry: CatalogEntry;
  readonly href: string;
  readonly tourAnchor?: boolean;
}

const CARD_PREVIEW_HEIGHT = 'h-64 md:h-72';
const CARD_IFRAME_HEIGHT = 720;
const CARD_PREVIEW_ROOT_MARGIN = '0px 0px 48px 0px';
const CARD_PREVIEW_UNLOAD_MS = 15_000;

/** Lazy iframe — static thumb in grid; hover/focus enables interaction. */
const CardPreview = memo(
  ({ entry, mode }: { readonly entry: CatalogEntry; readonly mode: PreviewMode }) => {
    const hostRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const { primary } = usePreviewTheme();
    const [src, setSrc] = useState<string | null>(null);
    const [engaged, setEngaged] = useState(false);
    const wasLoaded = usePreviewLoaded(entry.previewKey);
    const [showSpinner, setShowSpinner] = useState(false);
    const loadGenerationRef = useRef(0);
    const releaseSlotRef = useRef<(() => void) | null>(null);
    const hasSrcRef = useRef(false);
    const pendingLoadRef = useRef(false);

    const releaseLoadSlot = useCallback(() => {
      releaseSlotRef.current?.();
      releaseSlotRef.current = null;
    }, []);

    useEffect(() => {
      const host = hostRef.current;
      if (!host) {
        return;
      }

      let cancelled = false;
      let unloadTimer: ReturnType<typeof setTimeout> | undefined;

      const observer = new IntersectionObserver(
        ([intersection]) => {
          const visible = intersection === undefined ? false : intersection.isIntersecting === true;

          if (unloadTimer) {
            clearTimeout(unloadTimer);
            unloadTimer = undefined;
          }

          if (visible) {
            if (hasSrcRef.current || pendingLoadRef.current) {
              return;
            }

            pendingLoadRef.current = true;
            const generation = loadGenerationRef.current + 1;
            loadGenerationRef.current = generation;
            setShowSpinner(!wasLoaded);

            void acquirePreviewLoadSlot().then((release) => {
              if (cancelled || generation !== loadGenerationRef.current) {
                release();
                pendingLoadRef.current = false;
                return;
              }

              releaseSlotRef.current = release;
              pendingLoadRef.current = false;
              hasSrcRef.current = true;
              setSrc(
                buildPreviewSrc(entry.namespace, entry.name, {
                  thumb: true,
                  interactive: false,
                }),
              );
            });
            return;
          }

          if (!hasSrcRef.current) {
            return;
          }

          unloadTimer = setTimeout(() => {
            loadGenerationRef.current += 1;
            releaseLoadSlot();
            pendingLoadRef.current = false;
            hasSrcRef.current = false;
            setSrc(null);
            setShowSpinner(false);
          }, CARD_PREVIEW_UNLOAD_MS);
        },
        { rootMargin: CARD_PREVIEW_ROOT_MARGIN, threshold: 0.1 },
      );

      observer.observe(host);
      return () => {
        cancelled = true;
        loadGenerationRef.current += 1;
        if (unloadTimer) {
          clearTimeout(unloadTimer);
        }
        releaseLoadSlot();
        pendingLoadRef.current = false;
        observer.disconnect();
      };
    }, [entry.namespace, entry.name, wasLoaded, releaseLoadSlot]);

    useEffect(() => {
      if (!src) {
        return;
      }
      postPreviewTheme(iframeRef.current, mode, primary);
    }, [mode, primary, src]);

    const previewLoading = showSpinner && !wasLoaded;

    return (
      <div
        className={cn(
          'relative isolate overflow-hidden rounded-lg border border-border bg-muted/30',
          CARD_PREVIEW_HEIGHT,
        )}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setEngaged(false);
          }
        }}
        onFocus={() => setEngaged(true)}
        onMouseEnter={() => setEngaged(true)}
        onMouseLeave={() => setEngaged(false)}
        ref={hostRef}
        tabIndex={-1}
      >
        {src ? (
          <>
            <div
              className={cn(
                'absolute top-0 left-0 z-0 max-w-none origin-top-left scale-50 transition-opacity',
                previewLoading ? 'opacity-0' : 'opacity-100',
              )}
              style={{
                height: CARD_IFRAME_HEIGHT,
                width: '200%',
              }}
            >
              <iframe
                className="h-full w-full border-0 bg-background"
                loading="lazy"
                onLoad={() => {
                  releaseLoadSlot();
                  markPreviewLoaded(entry.previewKey);
                  setShowSpinner(false);
                  postPreviewTheme(iframeRef.current, mode, primary);
                }}
                onError={() => {
                  releaseLoadSlot();
                  setShowSpinner(false);
                }}
                ref={iframeRef}
                src={src}
                style={{ pointerEvents: engaged ? 'auto' : 'none' }}
                title={`Preview ${entry.name}`}
              />
            </div>
            {previewLoading ? (
              <PreviewLoadingOverlay className="absolute inset-0 z-10" size="sm" />
            ) : null}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-xs">
            Preview loads on scroll
          </div>
        )}
      </div>
    );
  },
  (prev, next) => prev.entry.previewKey === next.entry.previewKey && prev.mode === next.mode,
);
CardPreview.displayName = 'CardPreview';

const CardPreviewWithTheme = memo(({ entry }: { readonly entry: CatalogEntry }) => {
  const { resolvedTheme } = useTheme();
  const previewMode: PreviewMode = resolvedTheme === 'dark' ? 'dark' : 'light';
  return <CardPreview entry={entry} mode={previewMode} />;
});
CardPreviewWithTheme.displayName = 'CardPreviewWithTheme';

const componentCardPropsEqual = (prev: ComponentCardProps, next: ComponentCardProps): boolean =>
  prev.entry.previewKey === next.entry.previewKey &&
  prev.href === next.href &&
  prev.tourAnchor === next.tourAnchor;

/**
 * Render the component card component.
 *
 * @param props - Props passed to this component.
 * @returns A React element for the component-library UI.
 * @example
 * const element = <ComponentCard {...props} />;
 */
export const ComponentCard = memo(({ entry, href, tourAnchor = false }: ComponentCardProps) => {
  const sourceLabel = sourceLabelFor(entry.namespace);

  return (
    <article
      className={cn(
        'group relative isolate flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card p-4 sm:p-5 transition-colors hover:border-primary/40 hover:bg-accent/30 [content-visibility:auto] [contain-intrinsic-size:420px]',
      )}
      data-tour={tourAnchor ? 'component-card' : undefined}
    >
      {entry.previewable ? (
        <Link className="mb-4 block" href={href} prefetch={false}>
          <CardPreviewWithTheme entry={entry} />
        </Link>
      ) : null}

      <div className="mb-3 flex w-full min-w-0 flex-wrap items-stretch gap-1.5">
        <CopyPromptButton compact={true} entry={entry} />
        <ComponentSelectCheckbox compact={true} previewKey={entry.previewKey} />
      </div>

      <Link className="flex flex-col" href={href} prefetch={false}>
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <span className="font-medium text-[10px] text-muted-foreground uppercase tracking-wide">
            {sourceLabel}
          </span>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {categoryLabelFromSlug(entry.category)}
          </span>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {entry.kind}
          </span>
          {(() => {
            if (entry.previewable) {
              return (
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                  live
                </span>
              );
            }
            if (entry.unavailableReason) {
              return (
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {UNAVAILABLE_CHIP[entry.unavailableReason]}
                </span>
              );
            }
            return null;
          })()}
        </div>
        <span className="font-semibold text-base group-hover:text-primary">{entry.name}</span>
        <span className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
          {entry.importPath}
        </span>
      </Link>
    </article>
  );
}, componentCardPropsEqual);
ComponentCard.displayName = 'ComponentCard';
