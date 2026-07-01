'use client';

import { usePreviewTheme } from '@library/components/PreviewThemeProvider';
import { PreviewModeToggle, PrimaryPicker } from '@library/components/ThemeToolbar';
import type { CatalogEntry, UnavailableReason } from '@library/data/catalog';
import { buildPreviewSrc, type PreviewMode } from '@library/lib/theme';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

/** Honest, buyer-facing copy for why a component can't render live in the gallery. */
const UNAVAILABLE_COPY: Record<UnavailableReason, string> = {
  env: 'This example needs API keys or a live backend. Import it into your app to run it there.',
  deps: 'This component needs extra packages the starter does not install by default. Copy the source above and ask your agent to add its dependencies.',
  native:
    'This is a native or WebGL component. It renders inside your app, not in the isolated gallery preview.',
  nodemo: 'Live preview is coming soon. The source above is ready to copy into your app.',
};

function reasonOf(entry: CatalogEntry): UnavailableReason {
  return entry.unavailableReason ?? (entry.requiresEnv ? 'env' : 'nodemo');
}

function PreviewIframe({
  entry,
  mode,
  primary,
}: {
  entry: CatalogEntry;
  mode: PreviewMode;
  primary: string;
}) {
  const src = buildPreviewSrc(entry.namespace, entry.name, mode, primary);

  return (
    <iframe
      className="min-h-[520px] w-full rounded-lg border border-border bg-background"
      // key on src forces a fresh load when the mode/primary change, so the preview repaints
      key={src}
      loading="lazy"
      src={src}
      title={`Preview ${entry.name}`}
    />
  );
}

export function ComponentDetail({ entry }: { entry: CatalogEntry }) {
  const { resolvedTheme } = useTheme();
  const { primary } = usePreviewTheme();
  const [modeOverride, setModeOverride] = useState<PreviewMode | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Default the preview to the chrome theme; the per-preview toggle overrides just this one.
  const mode: PreviewMode = modeOverride ?? (resolvedTheme === 'dark' ? 'dark' : 'light');

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-8">
      <Link className="text-muted-foreground text-sm hover:text-foreground" href="/">
        ← Back to catalog
      </Link>
      <header className="mt-4 mb-6">
        <p className="font-medium text-muted-foreground text-xs uppercase">{entry.namespace}</p>
        <h1 className="font-bold text-2xl">{entry.name}</h1>
        <code className="mt-2 block rounded bg-muted px-2 py-1 font-mono text-sm">
          {entry.importPath}
        </code>
      </header>
      {entry.previewable ? (
        <div className="flex flex-col gap-3">
          {mounted ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <PreviewModeToggle mode={mode} onChange={setModeOverride} />
              <PrimaryPicker />
            </div>
          ) : null}
          <PreviewIframe entry={entry} mode={mode} primary={primary} />
        </div>
      ) : (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
          <p className="max-w-md">{UNAVAILABLE_COPY[reasonOf(entry)]}</p>
          {reasonOf(entry) === 'nodemo' ? (
            <Link className="text-primary underline underline-offset-2" href="/?tab=examples">
              Browse the Examples tab for related demos
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );
}
