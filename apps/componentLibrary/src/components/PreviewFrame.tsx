'use client';

import type { CatalogEntry } from '@library/data/catalog';
import Link from 'next/link';

function PreviewIframe({ entry }: { entry: CatalogEntry }) {
  const src = `/embed/${entry.namespace}/${encodeURIComponent(entry.name)}`;

  return (
    <iframe
      className="min-h-[520px] w-full rounded-lg border border-border bg-background"
      loading="lazy"
      src={src}
      title={`Preview ${entry.name}`}
    />
  );
}

export function ComponentDetail({ entry }: { entry: CatalogEntry }) {
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
        <PreviewIframe entry={entry} />
      ) : (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center text-sm">
          {entry.requiresEnv ? (
            <p>
              This example needs API keys or a live backend — import it into your VybeKiit app to
              run.
            </p>
          ) : (
            <>
              <p>No demo wrapper yet for this entry.</p>
              <Link className="text-primary underline underline-offset-2" href="/?tab=examples">
                Browse the Examples tab for related upstream demos
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
