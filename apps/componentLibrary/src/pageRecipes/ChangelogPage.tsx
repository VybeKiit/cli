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
import { Label } from '@vybekiit/ui/label';
import { SegmentedControl, SegmentedControlItem } from '@vybekiit/ui/segmented-control';
import { Bell, CheckCircle2, Loader2, Megaphone, Search, Sparkles, Wrench } from 'lucide-react';
import { type FormEvent, useId, useMemo, useState } from 'react';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/hooks/useDebouncedValue';
import { cn } from '@/lib/utils';
import { DemoPlugInPanel } from './shared/DemoPlugInPanel';
import { DemoRecipeFrame } from './shared/DemoRecipeFrame';

type EntryKind = 'feature' | 'fix' | 'improvement' | 'breaking';
type KindFilter = 'all' | EntryKind;

/** One public changelog entry. */
type ChangelogEntry = {
  readonly id: string;
  readonly version: string;
  readonly title: string;
  readonly body: string;
  readonly kind: EntryKind;
  readonly date: string;
  readonly published: boolean;
};

const KIND_META: Record<EntryKind, { readonly label: string; readonly className: string }> = {
  feature: {
    label: 'Feature',
    className: 'border-blue-500/30 bg-blue-500/10 text-blue-600',
  },
  fix: {
    label: 'Fix',
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600',
  },
  improvement: {
    label: 'Improvement',
    className: 'border-violet-500/30 bg-violet-500/10 text-violet-600',
  },
  breaking: {
    label: 'Breaking',
    className: 'border-red-500/40 bg-red-500/10 text-red-600',
  },
};

const KIND_FILTERS: readonly { readonly value: KindFilter; readonly label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'feature', label: 'Feature' },
  { value: 'fix', label: 'Fix' },
  { value: 'improvement', label: 'Improvement' },
  { value: 'breaking', label: 'Breaking' },
];

const INITIAL_ENTRIES: readonly ChangelogEntry[] = [
  {
    id: 'ch_01',
    version: '1.4.2',
    title: 'Webhook retry UI for failed deliveries',
    body: 'Operators can re-run failed webhook events from the integrations page with one click.',
    kind: 'feature',
    date: 'Jul 8, 2026',
    published: true,
  },
  {
    id: 'ch_02',
    version: '1.4.1',
    title: 'Safari checkout hang fixed',
    body: 'Hosted checkout handoff no longer spins forever on Safari 17 desktop.',
    kind: 'fix',
    date: 'Jul 2, 2026',
    published: true,
  },
  {
    id: 'ch_03',
    version: '1.4.0',
    title: 'Faster customer directory search',
    body: 'CRM search now indexes company and owner so large workspaces stay snappy.',
    kind: 'improvement',
    date: 'Jun 24, 2026',
    published: true,
  },
  {
    id: 'ch_04',
    version: '1.3.0',
    title: 'API key scopes required on create',
    body: 'New keys must pick scopes. Keys created before this release keep full access until rotated.',
    kind: 'breaking',
    date: 'Jun 10, 2026',
    published: true,
  },
  {
    id: 'ch_05',
    version: '1.4.3',
    title: 'Status page subscriber digests',
    body: 'Optional daily digest for status subscribers instead of only real-time alerts.',
    kind: 'feature',
    date: 'Draft',
    published: false,
  },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * A production-shaped product changelog: type filters, search, publish draft, and email subscribe
 * with validation. Fully interactive with local state; plug-in panel maps to a content/CMS source.
 *
 * @returns The changelog recipe element.
 * @example
 * const element = <ChangelogPage />;
 */
export const ChangelogPage = () => {
  // TODO: Load changelog entries from the configured content source (CMS or markdown).
  // TODO: Publish drafts and notify subscribers through the content + notifications actions.
  const emailId = useId();
  const emailErrorId = useId();
  const filterLabelId = useId();
  const searchId = useId();

  const [entries, setEntries] = useState<readonly ChangelogEntry[]>(INITIAL_ENTRIES);
  const [filter, setFilter] = useState<KindFilter>('all');
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const [showDrafts, setShowDrafts] = useState(false);
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const emailValid = EMAIL_PATTERN.test(email);

  const visible = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return entries.filter((entry) => {
      if (!(showDrafts || entry.published)) {
        return false;
      }
      const matchesKind = filter === 'all' || entry.kind === filter;
      const matchesQuery =
        q.length === 0 ||
        entry.title.toLowerCase().includes(q) ||
        entry.body.toLowerCase().includes(q) ||
        entry.version.includes(q);
      return matchesKind && matchesQuery;
    });
  }, [entries, filter, debouncedQuery, showDrafts]);

  const counts = useMemo(
    () => ({
      published: entries.filter((e) => e.published).length,
      drafts: entries.filter((e) => !e.published).length,
    }),
    [entries],
  );

  const publishDraft = (id: string) => {
    setEntries((current) =>
      current.map((entry) =>
        entry.id === id ? { ...entry, published: true, date: 'Just now' } : entry,
      ),
    );
    setNotice('Draft published. Subscribers would be notified next.');
  };

  const subscribe = (event: FormEvent) => {
    event.preventDefault();
    setEmailTouched(true);
    if (!emailValid) {
      return;
    }
    setSubscribing(true);
    globalThis.setTimeout(() => {
      setSubscribing(false);
      setSubscribed(true);
      setNotice(`Subscribed ${email} to product updates.`);
    }, 700);
  };

  return (
    <DemoRecipeFrame defaultTransition="slide" title="Changelog motion pass">
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <Badge className="w-fit" variant="secondary">
              Public · Changelog
            </Badge>
            <h1 className="font-bold text-3xl tracking-tight md:text-4xl">Product updates</h1>
            <p className="max-w-xl text-muted-foreground">
              Features, fixes, and breaking notes on a timeline. Filter by type or toggle drafts to
              publish.
            </p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold tabular-nums">{counts.published} published</p>
            <p className="text-muted-foreground">{counts.drafts} draft(s)</p>
          </div>
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

        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell aria-hidden="true" className="h-4 w-4" /> Get updates
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subscribed ? (
              <p className="text-muted-foreground text-sm">
                You are on the list. We only email when a release is published.
              </p>
            ) : (
              <form
                className="flex flex-col gap-3 sm:flex-row sm:items-end"
                noValidate={true}
                onSubmit={subscribe}
              >
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor={emailId}>Email</Label>
                  <Input
                    aria-describedby={emailTouched && !emailValid ? emailErrorId : undefined}
                    aria-invalid={emailTouched && !emailValid}
                    autoComplete="email"
                    id={emailId}
                    onBlur={() => setEmailTouched(true)}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    type="email"
                    value={email}
                  />
                  {emailTouched && !emailValid ? (
                    <p className="text-destructive text-sm" id={emailErrorId}>
                      Enter a valid email address.
                    </p>
                  ) : null}
                </div>
                <Button disabled={subscribing} type="submit">
                  {subscribing ? (
                    <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                  ) : (
                    <Bell aria-hidden="true" className="h-4 w-4" />
                  )}
                  Subscribe
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm" id={filterLabelId}>
            Type
          </span>
          <SegmentedControl
            onValueChange={(value) => setFilter(value as typeof filter)}
            value={filter}
          >
            {KIND_FILTERS.map((option) => (
              <SegmentedControlItem key={option.value} value={option.value}>
                {option.label}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
          <Button
            aria-pressed={showDrafts}
            onClick={() => setShowDrafts((v) => !v)}
            size="sm"
            type="button"
            variant={showDrafts ? 'secondary' : 'outline'}
          >
            {showDrafts ? 'Hide drafts' : 'Show drafts'}
          </Button>
          <div className="relative ml-auto w-full sm:w-52">
            <Search
              aria-hidden="true"
              className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              className="pl-9"
              id={searchId}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search releases…"
              type="search"
              value={query}
            />
          </div>
        </div>

        {visible.length === 0 ? (
          <Card>
            <CardContent className="p-0">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia>
                    <Megaphone aria-hidden="true" />
                  </EmptyMedia>
                  <EmptyTitle>No releases match</EmptyTitle>
                  <EmptyDescription>
                    Clear the type filter or search, or turn on drafts.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button
                    onClick={() => {
                      setFilter('all');
                      setQuery('');
                      setShowDrafts(true);
                    }}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Reset filters
                  </Button>
                </EmptyContent>
              </Empty>
            </CardContent>
          </Card>
        ) : (
          <ol className="relative space-y-4 border-border border-l pl-6">
            {visible.map((entry) => (
              <li className="relative" key={entry.id}>
                <span
                  aria-hidden="true"
                  className="absolute top-1 -left-[1.9rem] flex h-6 w-6 items-center justify-center rounded-full border bg-background"
                >
                  {entry.kind === 'fix' ? (
                    <Wrench className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <Sparkles className="h-3 w-3 text-primary" />
                  )}
                </span>
                <Card className={cn(!entry.published && 'border-dashed')}>
                  <CardContent className="space-y-2 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="font-mono font-normal" variant="outline">
                        v{entry.version}
                      </Badge>
                      <Badge
                        className={cn('font-normal', KIND_META[entry.kind].className)}
                        variant="outline"
                      >
                        {KIND_META[entry.kind].label}
                      </Badge>
                      {entry.published ? null : <Badge variant="secondary">Draft</Badge>}
                      <span className="text-muted-foreground text-xs">{entry.date}</span>
                    </div>
                    <h2 className="font-semibold text-base">{entry.title}</h2>
                    <p className="text-muted-foreground text-sm">{entry.body}</p>
                    {entry.published ? null : (
                      <Button onClick={() => publishDraft(entry.id)} size="sm" type="button">
                        Publish release
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
        )}

        <DemoPlugInPanel>
          <p>
            Fully interactive with local state — filters, drafts, publish, and subscribe all work
            offline. To make it real:
          </p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              Store entries in your CMS (MDX, Contentlayer, or a <code>changelog_entries</code>{' '}
              table) with <code>kind</code>, <code>version</code>, and <code>publishedAt</code>.
            </li>
            <li>
              <code>GET /api/changelog?kind=</code> returns published rows for the public page;
              drafts stay admin-only.
            </li>
            <li>
              Publish flips <code>publishedAt</code> and triggers subscriber email via{' '}
              <code>@vybekiit/email</code> / <code>notifications_log</code>.
            </li>
            <li>
              Expose an RSS feed at <code>/changelog.xml</code> for the same dataset.
            </li>
          </ol>
        </DemoPlugInPanel>
      </main>
    </DemoRecipeFrame>
  );
};

/** Gallery theme + motion wrapper. */
