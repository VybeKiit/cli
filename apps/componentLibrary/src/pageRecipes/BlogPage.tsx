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
import { SegmentedControl, SegmentedControlItem } from '@vybekiit/ui/segmented-control';
import { Separator } from '@vybekiit/ui/separator';
import { ArrowLeft, BookOpen, Calendar, FilePenLine, Newspaper, UserRound } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { DemoPlugInPanel } from './shared/DemoPlugInPanel';
import { DemoRecipeFrame } from './shared/DemoRecipeFrame';

type PostStatus = 'draft' | 'published';
type StatusFilter = 'all' | PostStatus;

/** One blog post card (mirrors blog_posts). */
type Post = {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly excerpt: string;
  readonly body: string;
  readonly status: PostStatus;
  readonly author: string;
  readonly publishedAt: string | null;
  readonly tags: readonly string[];
  readonly readMinutes: number;
};

const STATUS_META: Record<PostStatus, { readonly label: string; readonly className: string }> = {
  published: {
    label: 'Published',
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600',
  },
  draft: {
    label: 'Draft',
    className: 'border-amber-500/40 bg-amber-500/10 text-amber-600',
  },
};

const INITIAL_POSTS: readonly Post[] = [
  {
    id: 'post_01',
    title: 'How we shipped payments in a week',
    slug: 'shipped-payments-in-a-week',
    excerpt:
      'Lemon Squeezy as Merchant of Record, one webhook, and a GitHub invite gate — the whole money pipeline.',
    body: 'We refused to build card forms. Instead we hand off to Lemon Squeezy hosted checkout, verify the webhook signature, write the order to D1, and invite the buyer to the private repos. That single path is the business.\n\nThe checkout recipe in this library is the same shape we ship: integer cents, coupon math, and a plug-in panel that points at the real /api/checkout contract.',
    status: 'published',
    author: 'Maya Chen',
    publishedAt: 'Jun 12, 2026',
    tags: ['payments', 'launch'],
    readMinutes: 6,
  },
  {
    id: 'post_02',
    title: 'Database presets for vibe coders',
    slug: 'database-presets',
    excerpt:
      'One command creates CRM, tasks, or blog tables with RLS — so non-technical builders never write SQL.',
    body: 'vybekiit apply-preset customers creates the customers and customer_notes tables with user-owned RLS. The same pattern covers pipeline, support_tickets, tasks, calendar_events, search_documents, and blog_posts.\n\nPage recipes in the component library are designed to plug into those tables without rewriting the UI.',
    status: 'published',
    author: 'Sam Ortiz',
    publishedAt: 'May 28, 2026',
    tags: ['database', 'presets'],
    readMinutes: 5,
  },
  {
    id: 'post_03',
    title: 'Decide + Guide: the agent contract',
    slug: 'decide-and-guide',
    excerpt:
      'One action at a time, verify before advancing, plain language — the rules that keep non-coders unstuck.',
    body: 'Every buyer-facing skill follows the Decide + Guide contract. Agents never dump a wall of terminal commands. They do one step, check it worked, celebrate, and write the decision log.\n\nThis is what makes update-kit safe: a green suite plus an agent that will not leave you mid-flight.',
    status: 'published',
    author: 'Lee Park',
    publishedAt: 'May 3, 2026',
    tags: ['agents', 'product'],
    readMinutes: 4,
  },
  {
    id: 'post_04',
    title: 'Draft: pricing experiment notes',
    slug: 'pricing-experiment-notes',
    excerpt: 'Internal notes on the $29 price flag — not ready for the public blog yet.',
    body: 'We still believe $29 is underpriced for the kit, but raising it before the money pipeline is live confuses the narrative. Parked until the first 50 sales.\n\nDo not publish until legal reviews the refund copy.',
    status: 'draft',
    author: 'Maya Chen',
    publishedAt: null,
    tags: ['pricing', 'internal'],
    readMinutes: 3,
  },
  {
    id: 'post_05',
    title: 'Why Effect is eating our Result type',
    slug: 'effect-migration',
    excerpt:
      'Tagged errors, Schema, and Layers replace Result / zod / factory wiring — one green slice at a time.',
    body: 'ADR-0023 is the Effect migration. The spine packages are already on Effect + Schema. Templates and the CLI are next. Convert-as-you-touch; deslop enforces the shape on every diff.',
    status: 'published',
    author: 'Jordan Lee',
    publishedAt: 'Apr 18, 2026',
    tags: ['engineering', 'effect'],
    readMinutes: 8,
  },
  {
    id: 'post_06',
    title: 'Draft: mobile template preview',
    slug: 'mobile-template-preview',
    excerpt: 'Notes for the Expo mobile template launch post — still missing screenshots.',
    body: 'Cover Expo dev builds vs Expo Go, mmkv, and the tokens package. Need product shots before publish.',
    status: 'draft',
    author: 'Sam Ortiz',
    publishedAt: null,
    tags: ['mobile', 'draft'],
    readMinutes: 4,
  },
];

/**
 * A production-shaped blog index: post cards with draft/published filter, live empty state, and
 * click-to-open post preview with a back control. Plug-in panel maps onto the blog_posts preset.
 *
 * @returns The blog recipe element.
 * @example
 * const element = <BlogPage />;
 */
export const BlogPage = () => {
  // TODO: Load published and draft posts from the blog_posts preset tables.
  // TODO: Connect post cards to real /blog/[slug] routes.
  const filterLabelId = useId();
  const previewHeadingId = useId();

  const [filter, setFilter] = useState<StatusFilter>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const posts = INITIAL_POSTS;

  const visible = useMemo(
    () => (filter === 'all' ? posts : posts.filter((post) => post.status === filter)),
    [filter],
  );

  const openPost = posts.find((post) => post.id === openId) ?? null;

  const publishedCount = posts.filter((p) => p.status === 'published').length;
  const draftCount = posts.filter((p) => p.status === 'draft').length;

  if (openPost !== null) {
    return (
      <DemoRecipeFrame defaultTransition="fade" title="Blog motion pass">
        <main className="mx-auto max-w-3xl px-4 py-10">
          <Button
            className="mb-6"
            onClick={() => setOpenId(null)}
            size="sm"
            type="button"
            variant="ghost"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Back to posts
          </Button>
          <article aria-labelledby={previewHeadingId}>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className={cn('font-normal', STATUS_META[openPost.status].className)}
                variant="outline"
              >
                {STATUS_META[openPost.status].label}
              </Badge>
              {openPost.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
            <h1
              className="mt-3 font-bold text-3xl tracking-tight md:text-4xl"
              id={previewHeadingId}
              tabIndex={-1}
            >
              {openPost.title}
            </h1>
            <p className="mt-3 flex flex-wrap items-center gap-3 text-muted-foreground text-sm">
              <span className="inline-flex items-center gap-1">
                <UserRound aria-hidden="true" className="h-3.5 w-3.5" />
                {openPost.author}
              </span>
              {openPost.publishedAt ? (
                <span className="inline-flex items-center gap-1">
                  <Calendar aria-hidden="true" className="h-3.5 w-3.5" />
                  {openPost.publishedAt}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <FilePenLine aria-hidden="true" className="h-3.5 w-3.5" />
                  Unpublished draft
                </span>
              )}
              <span>{openPost.readMinutes} min read</span>
            </p>
            <Separator className="my-6" />
            <div className="space-y-4 text-base leading-relaxed">
              {openPost.body.split('\n\n').map((paragraph) => (
                <p key={paragraph.slice(0, 24)}>{paragraph}</p>
              ))}
            </div>
          </article>
        </main>
      </DemoRecipeFrame>
    );
  }

  return (
    <DemoRecipeFrame defaultTransition="fade" title="Blog motion pass">
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <Badge className="w-fit" variant="secondary">
              Blog
            </Badge>
            <h1 className="font-bold text-3xl tracking-tight md:text-4xl">Blog</h1>
            <p className="max-w-xl text-muted-foreground">
              Filter drafts vs published, then click a card to open the post preview.
            </p>
          </div>
          <div className="flex gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5">
              <Newspaper aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold tabular-nums">{publishedCount}</span> published
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5">
              <FilePenLine aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold tabular-nums">{draftCount}</span> drafts
            </span>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm" id={filterLabelId}>
            Status
          </span>
          <SegmentedControl
            aria-labelledby={filterLabelId}
            onValueChange={(value) => setFilter(value as typeof filter)}
            value={filter}
          >
            {(
              [
                { value: 'all', label: 'All' },
                { value: 'published', label: 'Published' },
                { value: 'draft', label: 'Drafts' },
              ] as const
            ).map((option) => (
              <SegmentedControlItem key={option.value} value={option.value}>
                {option.label}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        </div>

        {visible.length === 0 ? (
          <Empty variant="dashed">
            <EmptyHeader>
              <EmptyMedia>
                <BookOpen aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>No posts in this filter</EmptyTitle>
              <EmptyDescription>
                Switch to All to see every draft and published article.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={() => setFilter('all')} type="button" variant="outline">
                Show all
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <ul aria-label="Blog posts" className="grid gap-4 sm:grid-cols-2">
            {visible.map((post) => (
              <li key={post.id}>
                <button
                  className="h-full w-full text-left"
                  onClick={() => setOpenId(post.id)}
                  type="button"
                >
                  <Card className="h-full transition-colors hover:border-primary/40">
                    <CardHeader className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          className={cn('font-normal', STATUS_META[post.status].className)}
                          variant="outline"
                        >
                          {STATUS_META[post.status].label}
                        </Badge>
                        <span className="text-muted-foreground text-xs">
                          {post.readMinutes} min
                        </span>
                      </div>
                      <CardTitle className="text-lg leading-snug">{post.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {post.excerpt}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
                        <span className="inline-flex items-center gap-1">
                          <UserRound aria-hidden="true" className="h-3 w-3" />
                          {post.author}
                        </span>
                        {post.publishedAt ? (
                          <span className="inline-flex items-center gap-1">
                            <Calendar aria-hidden="true" className="h-3 w-3" />
                            {post.publishedAt}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {post.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </button>
              </li>
            ))}
          </ul>
        )}

        <DemoPlugInPanel>
          <p>
            Fully interactive with local state — status filter recomputes the grid, and clicking a
            card opens an in-page preview. To make it real:
          </p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              Run <code>vybekiit apply-preset blog_posts</code> for <code>blog_posts</code>,{' '}
              <code>blog_tags</code>, and <code>blog_post_tags</code>.
            </li>
            <li>
              <code>GET /api/blog/posts?status=published</code> powers the public index; include
              drafts only for signed-in authors.
            </li>
            <li>
              Route each card to <code>/blog/[slug]</code> instead of the in-page preview — keep the
              same card layout.
            </li>
            <li>
              Optional: use <code>@vybekiit/cms</code> helpers when you want markdown source instead
              of DB rows.
            </li>
          </ol>
        </DemoPlugInPanel>
      </main>
    </DemoRecipeFrame>
  );
};

/** Gallery theme + motion wrapper (matches the other recipes). */
