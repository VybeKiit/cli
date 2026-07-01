'use client';

import { ComponentCard } from '@library/components/ComponentCard';
import { GlobalThemeControls } from '@library/components/ThemeToolbar';
import {
  CATALOG_COMPONENTS,
  CATALOG_ENTRIES,
  CATALOG_EXAMPLES,
  CATALOG_NAMESPACES,
  COMPONENT_CATALOG_COUNT,
  type CatalogEntry,
} from '@library/data/catalog';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type TabKind = 'all' | 'components' | 'examples';

export function CatalogBrowser() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'examples' ? 'examples' : 'all';
  const [query, setQuery] = useState('');
  const [namespace, setNamespace] = useState<string>('all');
  const [tab, setTab] = useState<TabKind>(initialTab);

  const pool = useMemo(() => {
    if (tab === 'components') return CATALOG_COMPONENTS;
    if (tab === 'examples') return CATALOG_EXAMPLES;
    return CATALOG_ENTRIES;
  }, [tab]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pool.filter((entry: CatalogEntry) => {
      if (namespace !== 'all' && entry.namespace !== namespace) return false;
      if (!q) return true;
      return (
        entry.name.toLowerCase().includes(q) ||
        entry.namespace.toLowerCase().includes(q) ||
        entry.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [pool, query, namespace]);

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 overflow-y-auto border-border border-e bg-muted/20 p-4 lg:block">
        <p className="mb-3 font-semibold text-xs uppercase tracking-wide">Namespaces</p>
        <nav className="flex flex-col gap-1">
          <button
            className={`rounded-md px-2 py-1.5 text-start text-sm ${namespace === 'all' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            onClick={() => setNamespace('all')}
            type="button"
          >
            All ({COMPONENT_CATALOG_COUNT})
          </button>
          {CATALOG_NAMESPACES.map((ns) => (
            <button
              className={`rounded-md px-2 py-1.5 text-start text-sm ${namespace === ns ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              key={ns}
              onClick={() => setNamespace(ns)}
              type="button"
            >
              {ns}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-6 md:p-8">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-medium text-muted-foreground text-sm">VybeKiit · ui.vybekiit.com</p>
            <h1 className="mt-1 font-bold text-3xl tracking-tight">Component Library</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              {COMPONENT_CATALOG_COUNT} mirrored blocks from AI Elements, Kibo UI, Magic UI, BundUI,
              Kokonut, Aceternity, Untitled, and Gluestack, synced into every VybeKiit web scaffold.
            </p>
          </div>
          <GlobalThemeControls />
        </header>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search components…"
            type="search"
            value={query}
          />
          <select
            className="rounded-md border border-input bg-background px-3 py-2 text-sm lg:hidden"
            onChange={(e) => setNamespace(e.target.value)}
            value={namespace}
          >
            <option value="all">All namespaces</option>
            {CATALOG_NAMESPACES.map((ns) => (
              <option key={ns} value={ns}>
                {ns}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6 flex gap-2">
          {(
            [
              ['all', 'All', CATALOG_ENTRIES.length],
              ['components', 'Components', CATALOG_COMPONENTS.length],
              ['examples', 'Examples', CATALOG_EXAMPLES.length],
            ] as const
          ).map(([id, label, count]) => (
            <button
              className={`rounded-full px-3 py-1 text-sm ${tab === id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              key={id}
              onClick={() => setTab(id)}
              type="button"
            >
              {label} ({count})
            </button>
          ))}
        </div>

        <p className="mb-4 text-muted-foreground text-sm">
          Showing {filtered.length} of {pool.length}
        </p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((entry) => (
            <ComponentCard
              entry={entry}
              href={`/components/${entry.namespace}/${encodeURIComponent(entry.name)}`}
              key={`${entry.namespace}-${entry.name}`}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
