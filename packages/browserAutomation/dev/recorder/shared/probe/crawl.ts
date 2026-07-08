import type { Page } from 'playwright';
import { collectHrefsFromPage, snapshotPage } from './snapshot';
import type { PageSnapshot } from './types';

export type CrawlOptions = {
  maxMs: number;
  maxPages: number;
  origin: string;
};

const DEFAULT_CRAWL_OPTIONS: CrawlOptions = {
  maxPages: 50,
  maxMs: 60_000,
  origin: 'https://app.lemonsqueezy.com',
};

/** GET paths worth visiting early — still href-only, no button clicks. */
export const LS_PROBE_SEED_PATHS = ['/products/new', '/products/create'] as const;

/** Paths that likely contain selector targets; visited before low-priority pages. */
export const LS_PRIORITY_PATH_RE =
  /\/(products(?:\/new|\/create|\/)?|settings\/(api|webhooks?|stores))(\/|$)/i;

const HREF_DENY_PATTERNS = [
  /^mailto:/i,
  /^tel:/i,
  /^javascript:/i,
  /\/logout/i,
  /\/sign-out/i,
  /\/signout/i,
  /\/auth\/logout/i,
];

type QueueItem = { priority: number; url: string };

/** Normalize an href to a dedupe key (origin + pathname). Returns null if not crawlable. */
export function normalizeCrawlUrl(href: string, origin: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(href, origin);
  } catch {
    return null;
  }

  if (parsed.origin !== new URL(origin).origin) return null;
  if (HREF_DENY_PATTERNS.some((p) => p.test(parsed.pathname + parsed.search))) return null;

  parsed.hash = '';
  return `${parsed.origin}${parsed.pathname}`;
}

/** Whether an href should be enqueued for BFS crawl. */
export function isAllowedCrawlHref(href: string, origin: string): boolean {
  return normalizeCrawlUrl(href, origin) !== null;
}

export function crawlPriorityFor(url: string): number {
  return LS_PRIORITY_PATH_RE.test(url) ? 0 : 1;
}

function enqueue(queue: QueueItem[], url: string, origin: string): void {
  const norm = normalizeCrawlUrl(url, origin);
  if (!norm) return;
  if (queue.some((item) => item.url === norm)) return;
  queue.push({ url: norm, priority: crawlPriorityFor(norm) });
}

function dequeue(queue: QueueItem[]): string | undefined {
  queue.sort((a, b) => a.priority - b.priority);
  return queue.shift()?.url;
}

/** BFS crawl in-app hrefs via page.goto only — no button clicks. */
export async function crawlHrefPages(
  page: Page,
  startUrl: string,
  options: Partial<CrawlOptions> = {},
): Promise<{ pages: PageSnapshot[]; truncated: boolean; visitedCount: number }> {
  const opts = { ...DEFAULT_CRAWL_OPTIONS, ...options };
  const startNorm = normalizeCrawlUrl(startUrl, opts.origin);
  if (!startNorm) throw new Error(`Start URL is not crawlable: ${startUrl}`);

  const queue: QueueItem[] = [];
  enqueue(queue, startNorm, opts.origin);
  for (const seed of LS_PROBE_SEED_PATHS) {
    enqueue(queue, `${opts.origin}${seed}`, opts.origin);
  }

  const visited = new Set<string>();
  const pages: PageSnapshot[] = [];
  const startedAt = Date.now();
  let truncated = false;

  while (queue.length > 0 && visited.size < opts.maxPages) {
    if (Date.now() - startedAt > opts.maxMs) {
      truncated = true;
      break;
    }

    const target = dequeue(queue);
    if (!target || visited.has(target)) continue;
    visited.add(target);

    await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    const snap = await snapshotPage(page);
    pages.push(snap);

    for (const href of snap.hrefs) {
      enqueue(queue, href, opts.origin);
    }
  }

  if (queue.length > 0 && visited.size >= opts.maxPages) truncated = true;

  return { pages, truncated, visitedCount: visited.size };
}

export { collectHrefsFromPage };
