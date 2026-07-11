'use client';

import { Alert, AlertDescription } from '@vybekiit/ui/alert';
import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@vybekiit/ui/card';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@vybekiit/ui/empty';
import { Input } from '@vybekiit/ui/input';
import { Label } from '@vybekiit/ui/label';
import {
  Check,
  Filter,
  Loader2,
  PackageSearch,
  RefreshCw,
  Search,
  ShoppingCart,
  X,
} from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/hooks/useDebouncedValue';
import { cn } from '@/lib/utils';
import { DemoErrorState } from './shared/DemoErrorState';
import { DemoLoadState } from './shared/DemoLoadState';
import { DemoPlugInPanel } from './shared/DemoPlugInPanel';
import { DemoRecipeFrame } from './shared/DemoRecipeFrame';
import { formatUsdCents } from './shared/formatUsdCents';

/** Product category used by filter chips. */
type Category = 'all' | 'digital' | 'physical' | 'service' | 'bundle';

/** Sort modes for the catalog grid. */
type SortMode = 'featured' | 'price-asc' | 'price-desc' | 'name';

/** One catalog product. Prices are integer cents to avoid float drift. */
type Product = {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: Exclude<Category, 'all'>;
  readonly priceCents: number;
  readonly badge?: string;
  readonly featured: boolean;
  readonly initials: string;
};

const CATEGORY_LABEL: Record<Category, string> = {
  all: 'All',
  digital: 'Digital',
  physical: 'Physical',
  service: 'Service',
  bundle: 'Bundle',
};

/** Realistic multi-item catalog for the demo. */
const CATALOG: readonly Product[] = [
  {
    id: 'starter-kit',
    name: 'VybeKiit Starter Kit',
    description: 'Lifetime license for the full monorepo starter and agent layer.',
    category: 'digital',
    priceCents: 19_900,
    badge: 'Best seller',
    featured: true,
    initials: 'VK',
  },
  {
    id: 'template-bundle',
    name: 'Template Bundle',
    description: 'Web, mobile, and extension shells in one downloadable pack.',
    category: 'bundle',
    priceCents: 9900,
    badge: 'Save 20%',
    featured: true,
    initials: 'TB',
  },
  {
    id: 'founder-hoodie',
    name: 'Founder Hoodie',
    description: 'Heavyweight charcoal hoodie with embroidered mark. Ships worldwide.',
    category: 'physical',
    priceCents: 6500,
    featured: false,
    initials: 'FH',
  },
  {
    id: 'onboarding-call',
    name: 'Priority Onboarding Call',
    description: '60 minutes with an engineer to wire payments and deploy.',
    category: 'service',
    priceCents: 14_900,
    badge: 'Booked this week',
    featured: true,
    initials: 'OC',
  },
  {
    id: 'icon-pack',
    name: 'Brand Icon Pack',
    description: '120 SVG icons matching the kit design tokens.',
    category: 'digital',
    priceCents: 2900,
    featured: false,
    initials: 'IP',
  },
  {
    id: 'desk-mat',
    name: 'Studio Desk Mat',
    description: 'XXL padded mat with subtle grid. Physical only.',
    category: 'physical',
    priceCents: 4200,
    featured: false,
    initials: 'DM',
  },
  {
    id: 'agency-pack',
    name: 'Agency Client Pack',
    description: 'Multi-seat license plus white-label landing blocks.',
    category: 'bundle',
    priceCents: 49_900,
    badge: 'Teams',
    featured: true,
    initials: 'AP',
  },
  {
    id: 'audit-session',
    name: 'Launch Audit Session',
    description: 'Async code + go-live review with a written checklist.',
    category: 'service',
    priceCents: 24_900,
    featured: false,
    initials: 'LA',
  },
];

type LoadStatus = 'ready' | 'loading' | 'error';

/**
 * A production-shaped product catalog: category chips, search, sort, product cards with prices,
 * and live add-to-cart feedback. Empty / loading / error states are reachable by interacting —
 * not static variant cards. Local React state only; see the integration panel for real wiring.
 *
 * @returns The product grid recipe element.
 * @example
 * const element = <ProductGridPage />;
 */
export const ProductGridPage = () => {
  const searchId = useId();
  const sortId = useId();
  const cartLiveId = useId();

  const [status, setStatus] = useState<LoadStatus>('ready');
  const [category, setCategory] = useState<Category>('all');
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const [sort, setSort] = useState<SortMode>('featured');
  const [cartCount, setCartCount] = useState(0);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const products = useMemo(() => {
    const filtered = CATALOG.filter((product) => {
      if (category !== 'all' && product.category !== category) {
        return false;
      }
      if (debouncedQuery.trim().length === 0) {
        return true;
      }
      const needle = debouncedQuery.trim().toLowerCase();
      return (
        product.name.toLowerCase().includes(needle) ||
        product.description.toLowerCase().includes(needle)
      );
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sort === 'price-asc') {
        return a.priceCents - b.priceCents;
      }
      if (sort === 'price-desc') {
        return b.priceCents - a.priceCents;
      }
      if (sort === 'name') {
        return a.name.localeCompare(b.name);
      }
      // featured first, then name
      if (a.featured !== b.featured) {
        return a.featured ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    return sorted;
  }, [category, debouncedQuery, sort]);

  const reloadCatalog = () => {
    setStatus('loading');
    setToast(null);
    globalThis.setTimeout(() => setStatus('ready'), 900);
  };

  const simulateError = () => {
    setStatus('error');
    setToast(null);
  };

  const addToCart = (product: Product) => {
    setAddingId(product.id);
    // Simulated async cart write. Real apps POST cart_items after apply-preset cart.
    globalThis.setTimeout(() => {
      setCartCount((count) => count + 1);
      setAddingId(null);
      setToast(`${product.name} added to cart`);
      globalThis.setTimeout(() => setToast(null), 2400);
    }, 550);
  };

  // ---------- loading ----------
  if (status === 'loading') {
    return (
      <DemoRecipeFrame defaultTransition="fade" title="Product grid motion pass">
        <DemoLoadState
          detail="Fetching products, prices, and categories."
          title="Loading catalog…"
        />
      </DemoRecipeFrame>
    );
  }

  // ---------- error ----------
  if (status === 'error') {
    return (
      <DemoRecipeFrame defaultTransition="fade" title="Product grid motion pass">
        <DemoErrorState
          detail="The product list failed to load. Retry once the products API is reachable."
          onRetry={reloadCatalog}
          title="Catalog could not load"
        />
      </DemoRecipeFrame>
    );
  }

  // ---------- ready ----------
  return (
    <DemoRecipeFrame defaultTransition="fade" title="Product grid motion pass">
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Badge className="w-fit" variant="secondary">
              Products
            </Badge>
            <h1 className="font-bold text-3xl tracking-tight md:text-4xl">Product catalog</h1>
            <p className="max-w-xl text-muted-foreground">
              Filter by category, search, and sort — the grid updates live. Add items to see the
              cart badge grow. Clear filters until nothing matches to see empty.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              aria-atomic="true"
              aria-live="polite"
              className="inline-flex items-center gap-2 rounded-md border bg-card px-3 py-2 font-medium text-sm"
              id={cartLiveId}
            >
              <ShoppingCart aria-hidden="true" className="h-4 w-4" />
              Cart
              <Badge variant="default">{cartCount}</Badge>
            </span>
            <Button onClick={reloadCatalog} type="button" variant="outline">
              <RefreshCw aria-hidden="true" className="h-4 w-4" /> Reload
            </Button>
            <Button onClick={simulateError} type="button" variant="ghost">
              Simulate error
            </Button>
          </div>
        </div>

        {toast ? (
          <Alert className="mb-4" variant="success">
            <Check aria-hidden="true" className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between gap-3">
              <span>{toast}</span>
              <button
                aria-label="Dismiss"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setToast(null)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="mb-6 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Label className="sr-only" htmlFor={searchId}>
                Search products
              </Label>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                className="pl-9"
                id={searchId}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search products…"
                type="search"
                value={query}
              />
            </div>
            <div className="sm:w-48">
              <Label className="sr-only" htmlFor={sortId}>
                Sort products
              </Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                id={sortId}
                onChange={(event) => setSort(event.target.value as SortMode)}
                value={sort}
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="name">Name A–Z</option>
              </select>
            </div>
          </div>

          <div aria-label="Filter by category" className="flex flex-wrap gap-2" role="group">
            <Filter aria-hidden="true" className="mt-1.5 h-4 w-4 text-muted-foreground" />
            {(Object.keys(CATEGORY_LABEL) as Category[]).map((key) => (
              <Button
                aria-pressed={category === key}
                key={key}
                onClick={() => setCategory(key)}
                size="sm"
                type="button"
                variant={category === key ? 'default' : 'outline'}
              >
                {CATEGORY_LABEL[key]}
              </Button>
            ))}
          </div>
        </div>

        {products.length === 0 ? (
          <Empty variant="dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <PackageSearch aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>No products match</EmptyTitle>
              <EmptyDescription>
                Nothing fits your filters. Clear search or pick another category.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                onClick={() => {
                  setQuery('');
                  setCategory('all');
                }}
                type="button"
                variant="outline"
              >
                Clear filters
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => {
              const isAdding = addingId === product.id;
              return (
                <li key={product.id}>
                  <Card className="flex h-full flex-col overflow-hidden">
                    <div
                      aria-hidden="true"
                      className="flex h-36 items-center justify-center bg-muted font-semibold text-2xl text-muted-foreground"
                    >
                      {product.initials}
                    </div>
                    <CardHeader className="space-y-2 pb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="text-xs" variant="outline">
                          {CATEGORY_LABEL[product.category]}
                        </Badge>
                        {product.badge ? (
                          <Badge className="text-xs" variant="secondary">
                            {product.badge}
                          </Badge>
                        ) : null}
                      </div>
                      <CardTitle className="text-base leading-snug">{product.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 pb-2">
                      <p className="text-muted-foreground text-sm">{product.description}</p>
                    </CardContent>
                    <CardFooter className="flex items-center justify-between gap-2 border-t pt-4">
                      <span className="font-semibold tabular-nums">
                        {formatUsdCents(product.priceCents)}
                      </span>
                      <Button
                        aria-busy={isAdding}
                        disabled={isAdding}
                        onClick={() => addToCart(product)}
                        size="sm"
                        type="button"
                      >
                        {isAdding ? (
                          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                        ) : (
                          <ShoppingCart aria-hidden="true" className="h-4 w-4" />
                        )}
                        Add
                      </Button>
                    </CardFooter>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}

        <p className={cn('mt-4 text-muted-foreground text-sm')} aria-live="polite">
          Showing {products.length} of {CATALOG.length} products
        </p>

        <DemoPlugInPanel>
          <p>
            This recipe is fully interactive with local React state — no backend needed to demo it.
            To load a real catalog in your VybeKiit app:
          </p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              Run <code>vybekiit apply-preset products</code> so <code>products</code> and{' '}
              <code>product_variants</code> tables exist.
            </li>
            <li>
              Replace <code>CATALOG</code> with <code>GET /api/products</code> — each row needs{' '}
              <code>id</code>, <code>name</code>, <code>price_cents</code>, optional{' '}
              <code>image_url</code>, and category in <code>metadata</code>.
            </li>
            <li>
              On <b>Add</b>, after <code>vybekiit apply-preset cart</code>, upsert into{' '}
              <code>cart_items</code>:{' '}
              <code>{'{ cart_id, product_id, name, unit_price_cents, quantity: 1 }'}</code>.
            </li>
            <li>
              Loading / error states should mirror fetch lifecycle for that list endpoint — not a
              fake spinner with no path to recover.
            </li>
          </ol>
        </DemoPlugInPanel>
      </main>
    </DemoRecipeFrame>
  );
};

// TODO: Load catalog from GET /api/products after vybekiit apply-preset products.
// TODO: POST add-to-cart to cart_items after vybekiit apply-preset cart.
