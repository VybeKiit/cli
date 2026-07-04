'use client';

import { CatalogEntryGrid } from '@library/components/CatalogEntryGrid';
import { CatalogGridLayoutPicker } from '@library/components/CatalogGridLayoutPicker';
import { CatalogPaginationBar } from '@library/components/CatalogPaginationBar';
import { CatalogScrollModeToggle } from '@library/components/CatalogScrollModeToggle';
import { CatalogSidebar } from '@library/components/CatalogSidebar';
import { LibraryTutorial } from '@library/components/LibraryTutorial';
import { LayoutTooltip } from '@library/components/layout/LayoutTooltip';
import { SelectionTray } from '@library/components/SelectionTray';
import { GlobalThemeControls } from '@library/components/ThemeToolbar';
import { useCatalogData, useCatalogReady } from '@library/context/CatalogDataContext';
import { useCatalogGridLayout } from '@library/context/CatalogGridLayoutContext';
import {
  CATALOG_COMPONENT_COUNT,
  CATALOG_EXAMPLE_COUNT,
  COMPONENT_CATALOG_COUNT,
} from '@library/data/catalog.meta';
import { useCatalogPool } from '@library/hooks/useCatalogPool';
import { CATALOG_PAGE_SIZE, loadInfiniteScrollEnabled } from '@library/lib/catalogScrollMode';
import { matchesCatalogQuery } from '@library/lib/catalogSearch';
import { categoryLabelFromSlug } from '@library/lib/categoryLabels';
import { groupCatalogEntries } from '@library/lib/groupCatalogEntries';
import { CircleHelp } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

type TabKind = 'all' | 'components' | 'examples';

const TAB_TIPS: Record<TabKind, string> = {
  all: 'Browse every mirrored block and example in one view.',
  components: 'Reusable building blocks only — buttons, forms, heroes, and UI primitives.',
  examples: 'Full-page or composite demos — great for inspiration before you copy a prompt.',
};

function CatalogGridSkeleton({ count = 8 }: { readonly count?: number }) {
  return (
    <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 [&>*]:min-w-0">
      {Array.from({ length: count }, (_, index) => (
        <div
          className="animate-pulse rounded-xl border border-border bg-card p-4"
          key={`catalog-skeleton-${index}`}
        >
          <div className="mb-4 h-40 rounded-lg bg-muted" />
          <div className="mb-2 h-8 rounded bg-muted" />
          <div className="h-4 w-2/3 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

export function CatalogBrowser() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const catalog = useCatalogData();
  const { ready, error } = useCatalogReady();
  const { gridClassName } = useCatalogGridLayout();
  const initialTab = searchParams.get('tab') === 'examples' ? 'examples' : 'all';
  const initialCategory = searchParams.get('category') ?? 'all';
  const initialLibrary = searchParams.get('library') ?? 'all';

  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [category, setCategory] = useState<string>(initialCategory);
  const [library, setLibrary] = useState<string>(initialLibrary);
  const [tab, setTab] = useState<TabKind>(initialTab);
  const { pool, poolReady } = useCatalogPool(category, deferredQuery, ready);
  const [tourOpen, setTourOpen] = useState(false);
  const [infiniteScroll, setInfiniteScroll] = useState(false);
  const [scrollHydrated, setScrollHydrated] = useState(false);
  const [page, setPage] = useState(1);
  const [visibleCount, setVisibleCount] = useState(CATALOG_PAGE_SIZE);
  const gridTopRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInfiniteScroll(loadInfiniteScrollEnabled());
    setScrollHydrated(true);
  }, []);

  useEffect(() => {
    setPage(1);
    setVisibleCount(CATALOG_PAGE_SIZE);
  }, [deferredQuery, category, library, tab]);

  const syncUrl = useCallback(
    (next: { category?: string; library?: string; tab?: TabKind }) => {
      const params = new URLSearchParams();
      const cat = next.category ?? category;
      const lib = next.library ?? library;
      const kind = next.tab ?? tab;
      if (cat !== 'all') {
        params.set('category', cat);
      }
      if (lib !== 'all') {
        params.set('library', lib);
      }
      if (kind === 'examples') {
        params.set('tab', 'examples');
      }
      const qs = params.toString();
      router.replace(qs ? `/?${qs}` : '/', { scroll: false });
    },
    [category, library, router, tab],
  );

  const poolForTab = useMemo(() => {
    if (tab === 'components') {
      return pool.filter((entry) => entry.kind === 'component');
    }
    if (tab === 'examples') {
      return pool.filter((entry) => entry.kind === 'example');
    }
    return pool;
  }, [pool, tab]);

  const filtered = useMemo(
    () =>
      poolForTab.filter((entry) => {
        if (library !== 'all' && entry.namespace !== library) {
          return false;
        }
        if (category !== 'all' && entry.category !== category) {
          return false;
        }
        return matchesCatalogQuery(entry, deferredQuery);
      }),
    [poolForTab, deferredQuery, category, library],
  );

  const orderedFiltered = useMemo(
    () =>
      groupCatalogEntries(filtered, category, catalog.categories).flatMap((group) => group.entries),
    [catalog.categories, category, filtered],
  );

  const pageCount = Math.max(1, Math.ceil(orderedFiltered.length / CATALOG_PAGE_SIZE));

  const visibleEntries = useMemo(() => {
    if (!(scrollHydrated && poolReady)) {
      return orderedFiltered.slice(0, CATALOG_PAGE_SIZE);
    }
    if (infiniteScroll) {
      return orderedFiltered.slice(0, visibleCount);
    }
    const start = (page - 1) * CATALOG_PAGE_SIZE;
    return orderedFiltered.slice(start, start + CATALOG_PAGE_SIZE);
  }, [infiniteScroll, orderedFiltered, page, poolReady, scrollHydrated, visibleCount]);

  const visibleGrouped = useMemo(
    () => groupCatalogEntries(visibleEntries, category, catalog.categories),
    [catalog.categories, category, visibleEntries],
  );

  const hasMore = infiniteScroll && visibleEntries.length < orderedFiltered.length;
  const catalogReady = ready && poolReady;
  const tourAnchorKey = visibleGrouped[0]?.entries[0]?.previewKey;

  useEffect(() => {
    if (!(scrollHydrated && infiniteScroll && hasMore && poolReady)) {
      return;
    }

    const sentinel = loadMoreRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      ([intersection]) => {
        if (intersection?.isIntersecting) {
          setVisibleCount((current) =>
            Math.min(current + CATALOG_PAGE_SIZE, orderedFiltered.length),
          );
        }
      },
      { rootMargin: '80px 0px', threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, infiniteScroll, orderedFiltered.length, poolReady, scrollHydrated]);

  const handlePageChange = useCallback((nextPage: number) => {
    setPage(nextPage);
    gridTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleInfiniteScrollChange = useCallback((enabled: boolean) => {
    setInfiniteScroll(enabled);
    setPage(1);
    setVisibleCount(CATALOG_PAGE_SIZE);
  }, []);

  const handleCategoryChange = useCallback(
    (slug: string) => {
      setCategory(slug);
      syncUrl({ category: slug });
    },
    [syncUrl],
  );

  return (
    <SidebarProvider defaultOpen={true}>
      <CatalogSidebar category={category} onCategoryChange={handleCategoryChange} />

      <SidebarInset className="pb-24">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 md:hidden">
          <SidebarTrigger className="-ms-1" />
          <span className="font-semibold text-sm">Categories</span>
        </header>

        <main className="flex-1 p-6 md:p-8">
          <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-medium text-muted-foreground text-sm">
                VybeKiit · ui.vybekiit.com
              </p>
              <h1 className="mt-1 font-bold text-3xl tracking-tight">Component Library</h1>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                {COMPONENT_CATALOG_COUNT} mirrored blocks from AI Elements, Magic UI, BundUI, and
                more — plus VybeKiit mascots — browse by category or source library.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <LayoutTooltip label="Walk through search, previews, and how to copy prompts for your AI editor.">
                <Button onClick={() => setTourOpen(true)} size="sm" type="button" variant="outline">
                  <CircleHelp className="h-4 w-4" />
                  Take tour
                </Button>
              </LayoutTooltip>
              <CatalogGridLayoutPicker />
              <div data-tour="theme-controls">
                <GlobalThemeControls />
              </div>
            </div>
          </header>

          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
              data-tour="search"
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search components…"
              type="search"
              value={query}
            />
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm md:hidden"
              onChange={(e) => {
                setCategory(e.target.value);
                syncUrl({ category: e.target.value });
              }}
              value={category}
            >
              <option value="all">All categories</option>
              {catalog.categories.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.label}
                </option>
              ))}
            </select>
            <LayoutTooltip label="Filter by source library — Magic UI, Kibo, 21st.dev, BundUI, and more.">
              <select
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                data-tour="library-filter"
                onChange={(e) => {
                  setLibrary(e.target.value);
                  syncUrl({ library: e.target.value });
                }}
                value={library}
              >
                <option value="all">All libraries</option>
                {catalog.namespaces.map((ns) => (
                  <option key={ns} value={ns}>
                    {ns}
                  </option>
                ))}
              </select>
            </LayoutTooltip>
          </div>

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['all', 'All', catalog.count || COMPONENT_CATALOG_COUNT],
                  ['components', 'Components', catalog.componentCount || CATALOG_COMPONENT_COUNT],
                  ['examples', 'Examples', catalog.exampleCount || CATALOG_EXAMPLE_COUNT],
                ] as const
              ).map(([id, label, count]) => (
                <LayoutTooltip key={id} label={TAB_TIPS[id]}>
                  <button
                    className={`rounded-full px-3 py-1 text-sm ${tab === id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                    onClick={() => {
                      setTab(id);
                      syncUrl({ tab: id });
                    }}
                    type="button"
                  >
                    {label} ({count})
                  </button>
                </LayoutTooltip>
              ))}
            </div>
            <CatalogScrollModeToggle
              enabled={infiniteScroll}
              onEnabledChange={handleInfiniteScrollChange}
            />
          </div>

          <p className="mb-4 text-muted-foreground text-sm">
            {catalogReady ? (
              <>
                Showing {visibleEntries.length} of {orderedFiltered.length}
                {!infiniteScroll && orderedFiltered.length > CATALOG_PAGE_SIZE
                  ? ` · page ${page} of ${pageCount}`
                  : null}
              </>
            ) : error ? (
              <>Catalog failed to load: {error}</>
            ) : (
              <>Loading catalog…</>
            )}
          </p>

          <div className="flex flex-col gap-10" ref={gridTopRef}>
            {catalogReady ? (
              visibleGrouped.map(({ slug, entries }) => (
                <section key={slug}>
                  {category === 'all' ? (
                    <div className="sticky top-0 z-10 mb-4 border-border border-b bg-background/95 py-2 backdrop-blur">
                      <h2 className="font-semibold text-lg">
                        {categoryLabelFromSlug(slug)}{' '}
                        <span className="font-normal text-muted-foreground text-sm">
                          ({entries.length})
                        </span>
                      </h2>
                    </div>
                  ) : null}
                  <CatalogEntryGrid
                    entries={entries}
                    gridClassName={gridClassName}
                    tourAnchorKey={slug === visibleGrouped[0]?.slug ? tourAnchorKey : undefined}
                    virtualize={infiniteScroll}
                  />
                </section>
              ))
            ) : (
              <CatalogGridSkeleton count={CATALOG_PAGE_SIZE} />
            )}
            {hasMore ? <div aria-hidden="true" className="h-8" ref={loadMoreRef} /> : null}
          </div>
        </main>
        {infiniteScroll ? null : (
          <CatalogPaginationBar
            onPageChange={handlePageChange}
            page={page}
            pageCount={pageCount}
            pageSize={CATALOG_PAGE_SIZE}
            total={orderedFiltered.length}
          />
        )}
        <SelectionTray />
        <LibraryTutorial forceOpen={tourOpen} onForceClose={() => setTourOpen(false)} />
      </SidebarInset>
    </SidebarProvider>
  );
}
