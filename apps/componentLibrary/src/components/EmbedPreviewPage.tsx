'use client';

import { PreviewLoadingOverlay } from '@library/components/PreviewLoadingSpinner';
import { CATALOG_BY_KEY, type CatalogEntry, type UnavailableReason } from '@library/data/catalog';
import { resolvePreviewExport } from '@library/lib/resolvePreviewExport';
import { applyPrimaryVars, DEFAULT_PRIMARY } from '@library/lib/theme';
import { useSearchParams } from 'next/navigation';
import {
  Component,
  type ComponentType,
  type ReactNode,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { cn } from '@/lib/utils';

const THUMB_MIN_H = 'min-h-[120px]';
const FULL_MIN_H = 'min-h-[320px]';

/** Previews are third-party components — if one throws while rendering, fail soft. */
class PreviewErrorBoundary extends Component<
  { children: ReactNode; previewKey: string; isThumb: boolean },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    if (!this.props.isThumb) {
      window.parent.postMessage({ type: 'vk-preview-error', key: this.props.previewKey }, '*');
    }
  }

  render() {
    if (this.state.failed) {
      return (
        <div
          className={cn(
            'flex items-center justify-center p-4 text-destructive text-sm',
            this.props.isThumb ? THUMB_MIN_H : FULL_MIN_H,
          )}
        >
          This component could not render in isolation.
        </div>
      );
    }
    return this.props.children;
  }
}

/** Short, honest fallback shown if the embed URL is opened for a non-previewable entry. */
const EMBED_UNAVAILABLE: Record<UnavailableReason, string> = {
  env: 'Needs API keys or a live backend — run it inside your app.',
  deps: 'Needs extra packages the starter does not install by default.',
  native: 'Native/WebGL component — renders in your app, not the gallery.',
  nodemo: 'Live preview is coming soon.',
};

const EmbedPageFallback = () => {
  const isInteractive =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('interactive') === '1';

  if (isInteractive) {
    return <div aria-hidden={true} className={cn('bg-background', FULL_MIN_H)} />;
  }

  return <PreviewLoadingOverlay className={cn('p-6', FULL_MIN_H)} />;
};

const PreviewHost = ({
  Preview,
  previewKey,
  isThumb,
}: {
  Preview: ComponentType;
  previewKey: string;
  isThumb: boolean;
}) => {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isThumb) {
      return;
    }

    const timer = window.setTimeout(() => {
      const host = hostRef.current;
      const hasContent =
        host &&
        (host.offsetHeight > 8 ||
          host.textContent?.trim() ||
          host.querySelector('img, svg, canvas, button, input, [data-slot]'));
      window.parent.postMessage(
        {
          type: hasContent ? 'vk-preview-ready' : 'vk-preview-empty',
          key: previewKey,
        },
        '*',
      );
    }, 600);
    return () => window.clearTimeout(timer);
  }, [previewKey, isThumb]);

  return (
    <div className={cn(isThumb && 'vk-embed-thumb-host')} ref={hostRef}>
      <Preview />
    </div>
  );
};

const EmbedPreviewInner = ({
  previewKey,
  loadPreviewModule,
}: {
  readonly previewKey: string;
  readonly loadPreviewModule: (entry: CatalogEntry) => Promise<Record<string, unknown>>;
}) => {
  const searchParams = useSearchParams();
  const entry = CATALOG_BY_KEY[previewKey];

  const [Preview, setPreview] = useState<ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const themeParam = searchParams.get('theme');
  const primaryParam = searchParams.get('primary');
  const isThumb = searchParams.get('thumb') === '1';
  const isInteractive = searchParams.get('interactive') === '1';

  const applyTheme = useCallback((theme: string | null, primary: string | null) => {
    const root = document.documentElement;
    const isDark = theme === 'dark';
    root.classList.toggle('dark', isDark);
    root.classList.toggle('light', !isDark);
    applyPrimaryVars(root, primary === null ? DEFAULT_PRIMARY : primary);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('vk-embed-thumb', isThumb);
    root.classList.toggle('vk-embed-interactive', isInteractive);
    applyTheme(themeParam, primaryParam);
    return () => {
      root.classList.remove('vk-embed-thumb', 'vk-embed-interactive');
    };
  }, [themeParam, primaryParam, isThumb, isInteractive, applyTheme]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== window.parent) {
        return;
      }
      const data = event.data;
      if (
        typeof data === 'object' &&
        data !== null &&
        data.type === 'vk-preview-theme' &&
        typeof data.theme === 'string' &&
        typeof data.primary === 'string'
      ) {
        applyTheme(data.theme, data.primary);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [applyTheme]);

  useEffect(() => {
    if (!entry) {
      setError('Component not found in catalog.');
      setLoading(false);
      return;
    }

    if (!entry.buildSafe) {
      const unavailableReason =
        entry.unavailableReason === undefined
          ? entry.requiresEnv
            ? 'env'
            : 'nodemo'
          : entry.unavailableReason;
      setError(EMBED_UNAVAILABLE[unavailableReason]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setPreview(null);

    loadPreviewModule(entry)
      .then((mod) => {
        if (cancelled) {
          return;
        }
        const Resolved = resolvePreviewExport(mod, entry.renderMode);
        if (!Resolved) {
          setError('No renderable export found.');
          if (!isThumb) {
            window.parent.postMessage({ type: 'vk-preview-error', key: previewKey }, '*');
          }
          return;
        }
        setPreview(() => Resolved);
      })
      .catch((loadError) => {
        if (cancelled) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : 'Preview failed to load.');
        if (!isThumb) {
          window.parent.postMessage({ type: 'vk-preview-error', key: previewKey }, '*');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [entry, isThumb, loadPreviewModule, previewKey]);

  const stateMinH = isThumb ? THUMB_MIN_H : FULL_MIN_H;

  if (!entry) {
    return (
      <div
        className={cn(
          'flex items-center justify-center p-6 text-muted-foreground text-sm',
          stateMinH,
        )}
      >
        Component not found.
      </div>
    );
  }

  if (loading) {
    if (isInteractive) {
      return <div aria-hidden={true} className={cn('bg-background', stateMinH)} />;
    }
    return <PreviewLoadingOverlay className={cn('p-6', stateMinH)} />;
  }

  if (error) {
    return (
      <div
        className={cn('flex items-center justify-center p-6 text-destructive text-sm', stateMinH)}
      >
        {error}
      </div>
    );
  }

  if (!Preview) {
    return (
      <div
        className={cn(
          'flex items-center justify-center p-6 text-muted-foreground text-sm',
          stateMinH,
        )}
      >
        No preview available.
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-background text-foreground',
        isThumb ? 'overflow-hidden p-2' : cn('p-4', FULL_MIN_H),
      )}
    >
      <PreviewErrorBoundary isThumb={isThumb} previewKey={previewKey}>
        <PreviewHost Preview={Preview} isThumb={isThumb} previewKey={previewKey} />
      </PreviewErrorBoundary>
    </div>
  );
};

/**
 * Render the embed preview page component.
 *
 * @param props - Props passed to this component.
 * @returns A React element for the component-library UI.
 * @example
 * const element = <EmbedPreviewPage {...props} />;
 */
export const EmbedPreviewPage = ({
  previewKey,
  loadPreviewModule,
}: {
  readonly previewKey: string;
  readonly loadPreviewModule: (entry: CatalogEntry) => Promise<Record<string, unknown>>;
}) => (
  <Suspense fallback={<EmbedPageFallback />}>
    <EmbedPreviewInner loadPreviewModule={loadPreviewModule} previewKey={previewKey} />
  </Suspense>
);
