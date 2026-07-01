'use client';

import { CATALOG_BY_KEY, type UnavailableReason } from '@library/data/catalog';
import { loadPreviewModule } from '@library/lib/loadPreview.client';
import { resolvePreviewExport } from '@library/lib/resolvePreviewExport';
import { applyPrimaryVars, DEFAULT_PRIMARY } from '@library/lib/theme';
import { useParams, useSearchParams } from 'next/navigation';
import {
  Component,
  Suspense,
  useEffect,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';

/** Previews are third-party components — if one throws while rendering, fail soft. */
class PreviewErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="flex min-h-[320px] items-center justify-center p-6 text-destructive text-sm">
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

export default function EmbedPreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[320px] items-center justify-center p-6 text-muted-foreground text-sm">
          Loading preview…
        </div>
      }
    >
      <EmbedPreviewInner />
    </Suspense>
  );
}

function EmbedPreviewInner() {
  const params = useParams<{ namespace: string; name: string }>();
  const searchParams = useSearchParams();
  const namespace = params.namespace;
  const name = decodeURIComponent(params.name);
  const key = `${namespace}/${name}`;
  const entry = CATALOG_BY_KEY[key];

  const [Preview, setPreview] = useState<ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // The parent toolbar passes the chosen theme + primary through the iframe URL; apply
  // them to this document (its own browsing context) so the preview repaints to match.
  const themeParam = searchParams.get('theme');
  const primaryParam = searchParams.get('primary');
  useEffect(() => {
    const root = document.documentElement;
    const isDark = themeParam === 'dark';
    root.classList.toggle('dark', isDark);
    root.classList.toggle('light', !isDark);
    applyPrimaryVars(root, primaryParam ?? DEFAULT_PRIMARY);
  }, [themeParam, primaryParam]);

  useEffect(() => {
    if (!entry) {
      setError('Component not found in catalog.');
      setLoading(false);
      return;
    }

    if (!entry.buildSafe) {
      // Reached only if someone opens the embed URL directly for a non-previewable
      // entry (the catalog renders the reason inline instead of this iframe).
      setError(
        EMBED_UNAVAILABLE[entry.unavailableReason ?? (entry.requiresEnv ? 'env' : 'nodemo')],
      );
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
        const Component = resolvePreviewExport(mod, entry.renderMode);
        if (!Component) {
          setError('No renderable export found.');
          return;
        }
        setPreview(() => Component);
      })
      .catch((loadError) => {
        if (cancelled) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : 'Preview failed to load.');
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [entry]);

  if (!entry) {
    return (
      <div className="flex min-h-[320px] items-center justify-center p-6 text-muted-foreground text-sm">
        Component not found.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center p-6 text-muted-foreground text-sm">
        Loading preview…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[320px] items-center justify-center p-6 text-destructive text-sm">
        {error}
      </div>
    );
  }

  if (!Preview) {
    return (
      <div className="flex min-h-[320px] items-center justify-center p-6 text-muted-foreground text-sm">
        No preview available.
      </div>
    );
  }

  return (
    <div className="min-h-[320px] bg-background p-4 text-foreground">
      <PreviewErrorBoundary>
        <Preview />
      </PreviewErrorBoundary>
    </div>
  );
}
