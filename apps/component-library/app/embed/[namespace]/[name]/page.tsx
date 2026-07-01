'use client';

import { CATALOG_BY_KEY } from '@library/data/catalog';
import { loadPreviewModule } from '@library/lib/load-preview.client';
import { resolvePreviewExport } from '@library/lib/resolve-preview-export';
import { useParams } from 'next/navigation';
import { useEffect, useState, type ComponentType } from 'react';

export default function EmbedPreviewPage() {
  const params = useParams<{ namespace: string; name: string }>();
  const namespace = params.namespace;
  const name = decodeURIComponent(params.name);
  const key = `${namespace}/${name}`;
  const entry = CATALOG_BY_KEY[key];

  const [Preview, setPreview] = useState<ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!entry) {
      setError('Component not found in catalog.');
      setLoading(false);
      return;
    }

    if (!entry.buildSafe) {
      setError(
        entry.requiresEnv
          ? 'This example needs API keys or a live backend.'
          : 'Live preview is unavailable for this entry.',
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
      <Preview />
    </div>
  );
}
