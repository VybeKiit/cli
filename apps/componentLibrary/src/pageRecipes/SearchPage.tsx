'use client';

import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@vybekiit/ui/card';
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
import { BookOpen, FileText, FolderOpen, Search, UserRound, X } from 'lucide-react';
import { type ReactNode, useId, useMemo, useState } from 'react';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/hooks/useDebouncedValue';
import { cn } from '@/lib/utils';
import { DemoPlugInPanel } from './shared/DemoPlugInPanel';
import { DemoRecipeFrame } from './shared/DemoRecipeFrame';

type DocKind = 'doc' | 'customer' | 'ticket' | 'post';

/** One indexed search document (mirrors search_documents content + kind metadata). */
type SearchDoc = {
  readonly id: string;
  readonly title: string;
  readonly snippet: string;
  readonly kind: DocKind;
  readonly updatedAt: string;
};

const KIND_META: Record<
  DocKind,
  { readonly label: string; readonly icon: ReactNode; readonly className: string }
> = {
  doc: {
    label: 'Doc',
    icon: <FileText aria-hidden="true" className="h-4 w-4" />,
    className: 'border-blue-500/30 bg-blue-500/10 text-blue-600',
  },
  customer: {
    label: 'Customer',
    icon: <UserRound aria-hidden="true" className="h-4 w-4" />,
    className: 'border-violet-500/30 bg-violet-500/10 text-violet-600',
  },
  ticket: {
    label: 'Ticket',
    icon: <FolderOpen aria-hidden="true" className="h-4 w-4" />,
    className: 'border-amber-500/40 bg-amber-500/10 text-amber-600',
  },
  post: {
    label: 'Post',
    icon: <BookOpen aria-hidden="true" className="h-4 w-4" />,
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600',
  },
};

const KIND_FILTERS: readonly { readonly value: 'all' | DocKind; readonly label: string }[] = [
  { value: 'all', label: 'All types' },
  { value: 'doc', label: 'Docs' },
  { value: 'customer', label: 'Customers' },
  { value: 'ticket', label: 'Tickets' },
  { value: 'post', label: 'Posts' },
];

/** Realistic multi-type search index seed. */
const CORPUS: readonly SearchDoc[] = [
  {
    id: 'doc_webhook',
    title: 'Webhook signature verification',
    snippet:
      'Verify Lemon Squeezy webhook signatures with the shared secret before fulfilling an order.',
    kind: 'doc',
    updatedAt: '2d ago',
  },
  {
    id: 'doc_checkout',
    title: 'Hosted checkout handoff',
    snippet: 'POST /api/checkout returns a hosted URL. Never collect card data in your app.',
    kind: 'doc',
    updatedAt: '5d ago',
  },
  {
    id: 'cus_aria',
    title: 'Aria Montgomery · Northwind Labs',
    snippet: 'Scale plan · 12 seats · Owner Maya Chen · Active customer.',
    kind: 'customer',
    updatedAt: '1h ago',
  },
  {
    id: 'cus_priya',
    title: 'Priya Nair · Orbit Health',
    snippet: 'Growth trial · Seat limit question resolved last week.',
    kind: 'customer',
    updatedAt: '3d ago',
  },
  {
    id: 'tkt_safari',
    title: 'Checkout fails on Safari 17',
    snippet: 'Open · High priority · /api/checkout request hangs on Safari desktop.',
    kind: 'ticket',
    updatedAt: '12m ago',
  },
  {
    id: 'tkt_saml',
    title: 'SSO SAML metadata export',
    snippet: 'Open · Elena Vargas asking where to download Okta metadata.',
    kind: 'ticket',
    updatedAt: '1d ago',
  },
  {
    id: 'post_launch',
    title: 'How we shipped payments in a week',
    snippet: 'A founder story about Lemon Squeezy MoR and the GitHub invite gate.',
    kind: 'post',
    updatedAt: '1w ago',
  },
  {
    id: 'post_presets',
    title: 'Database presets for vibe coders',
    snippet: 'vybekiit apply-preset turns CRM, tasks, and blog into one command.',
    kind: 'post',
    updatedAt: '2w ago',
  },
  {
    id: 'doc_rls',
    title: 'Row-level security with user-owned tables',
    snippet: 'Every feature preset defaults to user_id RLS so buyers stay multi-tenant safe.',
    kind: 'doc',
    updatedAt: '3w ago',
  },
  {
    id: 'cus_elena',
    title: 'Elena Vargas · Summit Retail',
    snippet: 'Scale plan · $499 MRR · Interested in SSO and audit log.',
    kind: 'customer',
    updatedAt: '6h ago',
  },
];

/**
 * A production-shaped in-app search page: live query + type filters over a multi-kind corpus,
 * result counts, and a real empty state when nothing matches. Plug-in panel maps onto the
 * search_documents preset and full-text search.
 *
 * @returns The search recipe element.
 * @example
 * const element = <SearchPage />;
 */
export const SearchPage = () => {
  // TODO: Connect the search input to the search_documents full-text index.
  // TODO: Replace demo corpus with records from GET /api/search.
  const queryId = useId();
  const filterLabelId = useId();
  const resultsLiveId = useId();

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const [kindFilter, setKindFilter] = useState<'all' | DocKind>('all');

  const results = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return CORPUS.filter((doc) => {
      const matchesKind = kindFilter === 'all' || doc.kind === kindFilter;
      const matchesQuery =
        q.length === 0 ||
        doc.title.toLowerCase().includes(q) ||
        doc.snippet.toLowerCase().includes(q);
      return matchesKind && matchesQuery;
    });
  }, [debouncedQuery, kindFilter]);

  const clear = () => {
    setQuery('');
    setKindFilter('all');
  };

  return (
    <DemoRecipeFrame defaultTransition="fade" title="Search motion pass">
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6 space-y-1">
          <Badge className="w-fit" variant="secondary">
            Search
          </Badge>
          <h1 className="font-bold text-3xl tracking-tight md:text-4xl">Search</h1>
          <p className="max-w-xl text-muted-foreground">
            Results filter as you type. Try “webhook”, “Safari”, or a nonsense word for the empty
            state.
          </p>
        </div>

        <Card className="mb-4">
          <CardContent className="space-y-4 p-4">
            <div className="space-y-1.5">
              <Label htmlFor={queryId}>Query</Label>
              <div className="relative">
                <Search
                  aria-hidden="true"
                  className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  aria-controls={resultsLiveId}
                  className="pr-9 pl-9"
                  id={queryId}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search docs, customers, tickets…"
                  type="search"
                  value={query}
                />
                {query.length > 0 ? (
                  <button
                    aria-label="Clear search"
                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
                    onClick={() => setQuery('')}
                    type="button"
                  >
                    <X aria-hidden="true" className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>
            <div className="space-y-1.5">
              <span className="text-sm" id={filterLabelId}>
                Type
              </span>
              <div aria-labelledby={filterLabelId} className="flex flex-wrap gap-1" role="group">
                {KIND_FILTERS.map((filter) => (
                  <button
                    aria-pressed={kindFilter === filter.value}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs transition-colors',
                      kindFilter === filter.value
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                    key={filter.value}
                    onClick={() => setKindFilter(filter.value)}
                    type="button"
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <p aria-live="polite" className="mb-3 text-muted-foreground text-sm" id={resultsLiveId}>
          {results.length} result{results.length === 1 ? '' : 's'}
          {query.trim().length > 0 ? ` for “${query.trim()}”` : ''}
        </p>

        {results.length === 0 ? (
          <Empty variant="dashed">
            <EmptyHeader>
              <EmptyMedia>
                <Search aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>No matches</EmptyTitle>
              <EmptyDescription>
                Nothing in the index matches that query and type filter.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={clear} type="button" variant="outline">
                Clear search
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <ul aria-label="Search results" className="space-y-2">
            {results.map((doc) => {
              const meta = KIND_META[doc.kind];
              return (
                <li key={doc.id}>
                  <Card className="transition-colors hover:border-primary/40">
                    <CardHeader className="flex-row items-start gap-3 space-y-0 p-4 pb-2">
                      <span className="mt-0.5 text-muted-foreground">{meta.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle className="text-base">{doc.title}</CardTitle>
                          <Badge className={cn('font-normal', meta.className)} variant="outline">
                            {meta.label}
                          </Badge>
                        </div>
                      </div>
                      <span className="shrink-0 text-muted-foreground text-xs">
                        {doc.updatedAt}
                      </span>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pl-11">
                      <p className="text-muted-foreground text-sm leading-relaxed">{doc.snippet}</p>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}

        <DemoPlugInPanel>
          <p>
            Fully interactive with local state — the query and type chips recompute results
            instantly. To make it real:
          </p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              Run <code>vybekiit apply-preset search_documents</code> for the full-text{' '}
              <code>search_documents</code> table (tsvector + GIN).
            </li>
            <li>
              Index app records (customers, tickets, docs, posts) into{' '}
              <code>search_documents.content</code> when they change.
            </li>
            <li>
              <code>GET /api/search?q=&amp;kind=</code> runs <code>to_tsquery</code> against{' '}
              <code>search_vector</code> via <code>@vybekiit/search</code> /{' '}
              <code>@vybekiit/db</code>.
            </li>
            <li>
              Swap <code>CORPUS</code> for that response; keep empty-state and live count
              announcements as-is.
            </li>
          </ol>
        </DemoPlugInPanel>
      </main>
    </DemoRecipeFrame>
  );
};

/** Gallery theme + motion wrapper (matches the other recipes). */
