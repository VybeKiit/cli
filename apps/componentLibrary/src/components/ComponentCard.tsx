import { cn } from '@/lib/utils';
import type { CatalogEntry } from '@library/data/catalog';

const SOURCE_LABELS: Record<string, string> = {
  bundui: 'BundUI',
  magicui: 'Magic UI',
  kokonutui: 'Kokonut',
  aceternity: 'Aceternity',
  untitled: 'Untitled',
  gluestack: 'Gluestack',
  'ai-elements': 'AI Elements',
  kibo: 'Kibo UI',
};

interface ComponentCardProps {
  readonly entry: CatalogEntry;
  readonly href: string;
}

export function ComponentCard({ entry, href }: ComponentCardProps) {
  const sourceLabel = SOURCE_LABELS[entry.namespace] ?? entry.namespace;

  return (
    <a
      className={cn(
        'group flex flex-col rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/30',
      )}
      href={href}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-medium text-[10px] text-muted-foreground uppercase tracking-wide">
          {sourceLabel}
        </span>
        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
          {entry.kind}
        </span>
        {entry.kind === 'component' && entry.previewable ? (
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">live</span>
        ) : null}
      </div>
      <span className="font-semibold text-sm group-hover:text-primary">{entry.name}</span>
      <span className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
        {entry.importPath}
      </span>
    </a>
  );
}
