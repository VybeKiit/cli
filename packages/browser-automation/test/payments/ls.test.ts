import { describe, expect, it } from 'vitest';

import { LS_AUTOMATION_VERBS } from '../../src/domains/payments/ls/verbRegistry';
import { resolveLsSelectorEntry } from '../../src/domains/payments/ls/selectors/registry';
import {
  formatPriceFromCents,
  scrapeProductIdFromUrl,
  scrapeStoreIdFromHtml,
  scrapeVariantIdFromHtml,
} from '../../src/domains/payments/ls/scrape';
import { LS_DASHBOARD_URL } from '../../src/domains/payments/ls/types';

describe('LS verbRegistry', () => {
  it('includes standbyLogin and setup flow verbs', () => {
    expect(LS_AUTOMATION_VERBS).toContain('standbyLogin');
    expect(LS_AUTOMATION_VERBS).toContain('createProduct');
    expect(LS_AUTOMATION_VERBS).toContain('configureWebhook');
  });
});

describe('LS scrape helpers', () => {
  it('scrapes store and variant ids from embedded JSON', () => {
    const html = '&quot;store_id&quot;:270009,&quot;variant_id&quot;:1385541';
    expect(scrapeStoreIdFromHtml(html)).toBe('270009');
    expect(scrapeVariantIdFromHtml(html)).toBe('1385541');
  });

  it('parses product id from editor URL', () => {
    expect(scrapeProductIdFromUrl('https://app.lemonsqueezy.com/products/1184653')).toBe('1184653');
  });

  it('formats price from cents', () => {
    expect(formatPriceFromCents(2900)).toBe('29.00');
  });
});

describe('LS selector registry', () => {
  it('resolves fresh product.createButton from probe registry', () => {
    const entry = resolveLsSelectorEntry('product.createButton');
    expect(entry.kind).toBe('role');
    expect(entry).toMatchObject({ role: 'button', name: 'New Product' });
  });
});

describe('LS_DASHBOARD_URL', () => {
  it('points at the post-login dashboard', () => {
    expect(LS_DASHBOARD_URL).toBe('https://app.lemonsqueezy.com/dashboard');
  });
});
