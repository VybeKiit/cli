'use client';

import { Alert, AlertDescription } from '@vybekiit/ui/alert';
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
import { BookOpen, CheckCircle2, FileText, Search, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/hooks/useDebouncedValue';
import { cn } from '@/lib/utils';
import { DemoPlugInPanel } from '../shared/DemoPlugInPanel';
import { DemoRecipeFrame } from '../shared/DemoRecipeFrame';
import { CollectionButton } from './CollectionButton';

/** One help article. */
type Article = {
  readonly id: string;
  readonly collection: string;
  readonly title: string;
  readonly body: readonly string[];
  readonly stale: boolean;
  readonly updatedAt: string;
};

const COLLECTIONS = ['Getting started', 'Payments', 'Teams', 'Troubleshooting'] as const;

const INITIAL_ARTICLES: readonly Article[] = [
  {
    id: 'doc_01',
    collection: 'Getting started',
    title: 'Create your first workspace',
    body: [
      'After checkout, open the invite email and accept the GitHub org invite.',
      'Run the onboarding wizard once: pick a product name, accent color, and invite teammates.',
      'When onboarding completes, the app routes you to the dashboard automatically.',
    ],
    stale: false,
    updatedAt: 'Jun 12, 2026',
  },
  {
    id: 'doc_02',
    collection: 'Payments',
    title: 'Connect Lemon Squeezy',
    body: [
      'Set LEMONSQUEEZY_API_KEY and the store id in your environment.',
      'Map each plan to a monthly and annual variant id from the Lemon Squeezy dashboard.',
      'The shipped webhook records orders in D1 and runs the GitHub invite gate.',
    ],
    stale: false,
    updatedAt: 'Jul 1, 2026',
  },
  {
    id: 'doc_03',
    collection: 'Payments',
    title: 'Issue refunds from billing admin',
    body: [
      'Open Admin → Billing, find the subscription, and use Cancel or Retry as needed.',
      'Refunds for one-off orders should be issued in the Lemon Squeezy dashboard first.',
    ],
    stale: true,
    updatedAt: 'Mar 3, 2026',
  },
  {
    id: 'doc_04',
    collection: 'Teams',
    title: 'Invite members and assign roles',
    body: [
      'Go to Settings → Team and enter an email plus a role (Owner, Admin, Editor, Viewer).',
      'Invites create organization_members rows when the organizations preset is applied.',
      'Only Owners can promote someone else to Owner.',
    ],
    stale: false,
    updatedAt: 'May 20, 2026',
  },
  {
    id: 'doc_05',
    collection: 'Troubleshooting',
    title: 'Webhook signature mismatch',
    body: [
      'Confirm the webhook secret matches the value Lemon Squeezy shows for your endpoint.',
      'Do not re-encode the raw body before verifying the signature.',
      'Failed events land in webhook_events for replay from Integrations.',
    ],
    stale: false,
    updatedAt: 'Jun 28, 2026',
  },
  {
    id: 'doc_06',
    collection: 'Getting started',
    title: 'Update the kit safely',
    body: [
      'Run your test suite until green, then run update-kit to pull the latest mirror.',
      'Resolve any OWNED file conflicts carefully — maintained packages should not be edited.',
    ],
    stale: true,
    updatedAt: 'Jan 14, 2026',
  },
];

type Feedback = 'up' | 'down' | null;

/**
 * A production-shaped docs page: collection sidebar, live search, article view, helpful/not
 * feedback, and stale-doc badges. Fully interactive with local state.
 *
 * @returns The docs recipe element.
 * @example
 * const element = <DocsPage />;
 */
export const DocsPage = () => {
  // TODO: Load documentation collections and articles from the configured content source.
  // TODO: Save article feedback via POST /api/docs/feedback.
  const searchId = useId();

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const [collection, setCollection] = useState<string | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string>(INITIAL_ARTICLES[0]?.id ?? '');
  const [feedback, setFeedback] = useState<Record<string, Feedback>>({});
  const [notice, setNotice] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return INITIAL_ARTICLES.filter((article) => {
      const matchesCollection = collection === 'all' || article.collection === collection;
      const matchesQuery =
        q.length === 0 ||
        article.title.toLowerCase().includes(q) ||
        article.body.some((p) => p.toLowerCase().includes(q));
      return matchesCollection && matchesQuery;
    });
  }, [collection, debouncedQuery]);

  const selected = visible.find((a) => a.id === selectedId) ?? visible[0] ?? null;

  const sendFeedback = (articleId: string, value: Exclude<Feedback, null>) => {
    setFeedback((current) => ({ ...current, [articleId]: value }));
    setNotice(
      value === 'up'
        ? 'Thanks — glad this helped.'
        : 'Thanks — we flagged this article for review.',
    );
  };

  return (
    <DemoRecipeFrame defaultTransition="fade" title="Docs motion pass">
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 space-y-1">
          <Badge className="w-fit" variant="secondary">
            Docs
          </Badge>
          <h1 className="font-bold text-3xl tracking-tight md:text-4xl">Help center</h1>
          <p className="max-w-xl text-muted-foreground">
            Browse collections or search articles. Leave feedback on any page — stale docs are
            marked for owners.
          </p>
        </div>

        <p aria-live="polite" className="sr-only">
          {notice ?? ''}
        </p>
        {notice ? (
          <Alert className="mb-4" variant="success">
            <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
            <AlertDescription>{notice}</AlertDescription>
          </Alert>
        ) : null}

        <div className="mb-4">
          <label className="sr-only" htmlFor={searchId}>
            Search docs
          </label>
          <div className="relative max-w-md">
            <Search
              aria-hidden="true"
              className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              className="pl-9"
              id={searchId}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search articles…"
              type="search"
              value={query}
            />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <aside className="space-y-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Collections</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 p-2 pt-0 sm:p-3 sm:pt-0">
                <CollectionButton
                  active={collection === 'all'}
                  label="All articles"
                  onClick={() => setCollection('all')}
                />
                {COLLECTIONS.map((name) => (
                  <CollectionButton
                    active={collection === name}
                    key={name}
                    label={name}
                    onClick={() => setCollection(name)}
                  />
                ))}
              </CardContent>
            </Card>
            <p className="px-1 text-muted-foreground text-xs">
              {visible.length} article{visible.length === 1 ? '' : 's'}
              {INITIAL_ARTICLES.filter((a) => a.stale).length > 0
                ? ` · ${INITIAL_ARTICLES.filter((a) => a.stale).length} stale`
                : ''}
            </p>
          </aside>

          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <Card>
              <CardContent className="p-2 sm:p-3">
                {visible.length === 0 ? (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia>
                        <BookOpen aria-hidden="true" />
                      </EmptyMedia>
                      <EmptyTitle>No articles match</EmptyTitle>
                      <EmptyDescription>Try another collection or clear search.</EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                      <Button
                        onClick={() => {
                          setQuery('');
                          setCollection('all');
                        }}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        Clear filters
                      </Button>
                    </EmptyContent>
                  </Empty>
                ) : (
                  <ul aria-label="Articles" className="divide-y">
                    {visible.map((article) => {
                      const active = selected?.id === article.id;
                      return (
                        <li key={article.id}>
                          <button
                            className={cn(
                              'flex w-full items-start gap-3 px-2 py-3 text-left transition-colors',
                              active ? 'bg-primary/5' : 'hover:bg-muted/50',
                            )}
                            onClick={() => setSelectedId(article.id)}
                            type="button"
                          >
                            <FileText
                              aria-hidden="true"
                              className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                            />
                            <span className="min-w-0">
                              <span className="block font-medium text-sm">{article.title}</span>
                              <span className="mt-0.5 flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
                                <span>{article.collection}</span>
                                {article.stale ? (
                                  <Badge
                                    className="border-amber-500/40 bg-amber-500/10 font-normal text-amber-600"
                                    variant="outline"
                                  >
                                    Needs review
                                  </Badge>
                                ) : null}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>

            {selected ? (
              <Card>
                <CardHeader className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{selected.collection}</Badge>
                    {selected.stale ? (
                      <Badge
                        className="border-amber-500/40 bg-amber-500/10 font-normal text-amber-600"
                        variant="outline"
                      >
                        Stale · {selected.updatedAt}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">
                        Updated {selected.updatedAt}
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-xl">{selected.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selected.body.map((paragraph) => (
                    <p className="text-muted-foreground text-sm leading-relaxed" key={paragraph}>
                      {paragraph}
                    </p>
                  ))}
                  <div className="border-t pt-4">
                    <p className="mb-2 font-medium text-sm">Was this helpful?</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        aria-pressed={feedback[selected.id] === 'up'}
                        onClick={() => sendFeedback(selected.id, 'up')}
                        size="sm"
                        type="button"
                        variant={feedback[selected.id] === 'up' ? 'default' : 'outline'}
                      >
                        <ThumbsUp aria-hidden="true" className="h-4 w-4" /> Yes
                      </Button>
                      <Button
                        aria-pressed={feedback[selected.id] === 'down'}
                        onClick={() => sendFeedback(selected.id, 'down')}
                        size="sm"
                        type="button"
                        variant={feedback[selected.id] === 'down' ? 'default' : 'outline'}
                      >
                        <ThumbsDown aria-hidden="true" className="h-4 w-4" /> No
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>

        <DemoPlugInPanel>
          <p>
            Fully interactive with local state — search, collections, article selection, and
            feedback all update live. To make it real:
          </p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              Author articles as MDX or rows in a CMS; group by <code>collection</code> and mark{' '}
              <code>reviewedAt</code> for stale detection.
            </li>
            <li>
              <code>GET /api/docs?q=&amp;collection=</code> powers search; article routes use{' '}
              <code>/docs/[slug]</code>.
            </li>
            <li>
              <code>POST /api/docs/feedback</code> stores thumbs up/down with article id and
              optional comment.
            </li>
            <li>
              Flag articles older than your review window as “Needs review” for content owners.
            </li>
          </ol>
        </DemoPlugInPanel>
      </main>
    </DemoRecipeFrame>
  );
};

/** Sidebar collection filter button. */
