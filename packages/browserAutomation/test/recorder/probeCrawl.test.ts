import { describe, expect, it } from 'vitest';

import {
  isAllowedCrawlHref,
  normalizeCrawlUrl,
  crawlPriorityFor,
  LS_PROBE_SEED_PATHS,
} from '../../dev/recorder/shared/probe/crawl';

const ORIGIN = 'https://app.lemonsqueezy.com';

describe('normalizeCrawlUrl', () => {
  it('strips hash and query for dedupe', () => {
    expect(normalizeCrawlUrl(`${ORIGIN}/products?foo=1#bar`, ORIGIN)).toBe(`${ORIGIN}/products`);
  });

  it('rejects external origins', () => {
    expect(normalizeCrawlUrl('https://google.com/foo', ORIGIN)).toBeNull();
  });

  it('rejects logout hrefs', () => {
    expect(normalizeCrawlUrl(`${ORIGIN}/logout`, ORIGIN)).toBeNull();
    expect(normalizeCrawlUrl(`${ORIGIN}/auth/sign-out`, ORIGIN)).toBeNull();
  });

  it('rejects mailto and javascript', () => {
    expect(isAllowedCrawlHref('mailto:support@lemonsqueezy.com', ORIGIN)).toBe(false);
    expect(isAllowedCrawlHref('javascript:void(0)', ORIGIN)).toBe(false);
  });

  it('allows in-app dashboard and settings paths', () => {
    expect(normalizeCrawlUrl(`${ORIGIN}/dashboard`, ORIGIN)).toBe(`${ORIGIN}/dashboard`);
    expect(normalizeCrawlUrl(`${ORIGIN}/settings/api`, ORIGIN)).toBe(`${ORIGIN}/settings/api`);
  });

  it('prioritizes products and settings targets', () => {
    expect(crawlPriorityFor(`${ORIGIN}/products`)).toBe(0);
    expect(crawlPriorityFor(`${ORIGIN}/settings/api`)).toBe(0);
    expect(crawlPriorityFor(`${ORIGIN}/affiliates/clicks`)).toBe(1);
  });

  it('includes seed paths for product create forms', () => {
    expect(LS_PROBE_SEED_PATHS).toContain('/products/new');
  });
});
