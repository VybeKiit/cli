import { describe, expect, it } from 'vitest';

import {
  candidateToEntry,
  classifyCrawlPages,
  mergeClassifiedMatches,
  scrapeIdMatches,
  scrapeIdsFromHtml,
} from '../../dev/recorder/shared/probe/classify';
import type { DomCandidate, PageSnapshot } from '../../dev/recorder/shared/probe/types';

function candidate(overrides: Partial<DomCandidate> & { tag: string }): DomCandidate {
  return {
    ariaLabel: null,
    associatedLabel: null,
    href: null,
    id: null,
    nearestHeading: null,
    placeholder: null,
    role: null,
    textContent: null,
    type: null,
    ...overrides,
  };
}

function page(pathname: string, candidates: DomCandidate[], hrefs: string[] = []): PageSnapshot {
  return {
    url: `https://app.lemonsqueezy.com${pathname}`,
    pathname,
    candidates,
    hrefs,
  };
}

describe('candidateToEntry', () => {
  it('prefers role+name for buttons', () => {
    expect(
      candidateToEntry(candidate({ tag: 'button', textContent: 'New product' })),
    ).toEqual({ kind: 'role', role: 'button', name: 'New product' });
  });

  it('uses associated label for textboxes without id', () => {
    expect(
      candidateToEntry(
        candidate({ tag: 'input', associatedLabel: 'Product name', placeholder: 'Name' }),
      ),
    ).toEqual({ kind: 'role', role: 'textbox', name: 'Product name' });
  });

  it('prefers css id for inputs with id attribute', () => {
    expect(candidateToEntry(candidate({ tag: 'input', id: 'url', associatedLabel: 'Callback URL' }))).toEqual({
      kind: 'css',
      selector: 'input#url',
    });
  });
});

describe('classifyCrawlPages', () => {
  it('matches nested single payment pricing option on product editor path', () => {
    const matched = classifyCrawlPages([
      page('/products/42', [candidate({ tag: 'button', textContent: 'Single payment' })]),
    ]);
    expect(matched['product.pricing.single.option']?.entry).toEqual({
      kind: 'role',
      role: 'button',
      name: 'Single payment',
    });
  });

  it('matches second file input for product.files.uploadInput', () => {
    const matched = classifyCrawlPages([
      page('/products/42', [
        candidate({ tag: 'input', type: 'file' }),
        candidate({ tag: 'input', type: 'file' }),
      ]),
    ]);
    expect(matched['product.files.uploadInput']).toBeDefined();
    expect(matched['product.media.uploadInput']).toBeDefined();
  });

  it('matches settings toggle via checkbox role', () => {
    const matched = classifyCrawlPages([
      page('/products/42', [
        candidate({
          tag: 'div',
          role: 'checkbox',
          ariaLabel: 'Generate license keys',
        }),
      ]),
    ]);
    expect(matched['product.settings.licenseKeysToggle']?.entry).toEqual({
      kind: 'role',
      role: 'checkbox',
      name: 'Generate license keys',
    });
  });

  it('matches product create button on products path', () => {
    const matched = classifyCrawlPages([
      page('/products', [candidate({ tag: 'a', textContent: 'New product', href: 'https://app.lemonsqueezy.com/products/new' })]),
    ]);
    expect(matched['product.createButton']?.entry).toEqual({
      kind: 'role',
      role: 'link',
      name: 'New product',
    });
  });

  it('matches webhook url input on webhook settings path', () => {
    const matched = classifyCrawlPages([
      page('/settings/webhooks', [
        candidate({ tag: 'input', id: 'url', associatedLabel: 'Callback URL', placeholder: 'example.com/webhook' }),
      ]),
    ]);
    expect(matched['webhook.urlInput']?.entry).toEqual({ kind: 'css', selector: 'input#url' });
  });

  it('scrapes store id from crawled urls', () => {
    const idMatches = scrapeIdMatches([
      page('/dashboard', [], [`https://app.lemonsqueezy.com/stores/12345/products`]),
    ]);
    const merged = mergeClassifiedMatches(idMatches);
    expect(merged['dashboard.storeId']?.entry).toEqual({
      kind: 'css',
      selector: 'a[href*="/stores/12345"]',
    });
  });

  it('scrapes variant id from variant hrefs', () => {
    const idMatches = scrapeIdMatches([
      page('/products/1', [candidate({ tag: 'a', textContent: 'Default', href: 'https://app.lemonsqueezy.com/variants/999' })]),
    ]);
    const merged = mergeClassifiedMatches(idMatches);
    expect(merged['dashboard.variantId']).toBeDefined();
  });

  it('scrapes embedded store_id from page html', () => {
    const html = '<script>{"store_id":4242,"variant_id":7777}</script>';
    const merged = mergeClassifiedMatches(scrapeIdsFromHtml(html, 'https://app.lemonsqueezy.com/dashboard'));
    expect(merged['dashboard.storeId']?.entry).toEqual({
      kind: 'css',
      selector: '[src*="/stores/4242/"]',
    });
  });

  it('scrapes html-entity encoded store_id', () => {
    const html = '&quot;store_id&quot;:270009,&quot;order_id&quot;:1';
    const merged = mergeClassifiedMatches(scrapeIdsFromHtml(html, 'https://app.lemonsqueezy.com/settings/stores'));
    const entry = merged['dashboard.storeId']?.entry;
    expect(entry?.kind).toBe('css');
    if (entry?.kind === 'css') expect(entry.selector).toBe('[src*="/stores/270009/"]');
  });
});
