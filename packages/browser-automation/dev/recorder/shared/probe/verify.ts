import type { Locator, Page } from 'playwright';

import type { ParsedEntry } from '../draft';
import type { ClassifiedMatch } from './types';

function locatorFor(page: Page, entry: ParsedEntry): Locator {
  switch (entry.kind) {
    case 'css':
      return page.locator(entry.selector);
    case 'label':
      return page.getByLabel(entry.text);
    case 'placeholder':
      return page.getByPlaceholder(entry.text);
    case 'role':
      return page.getByRole(entry.role as Parameters<Page['getByRole']>[0], { name: entry.name });
  }
}

/** Read-only locator check — no clicks. */
export async function verifyEntryOnPage(page: Page, entry: ParsedEntry): Promise<boolean> {
  const locator = locatorFor(page, entry);
  const count = await locator.count();
  if (count === 0) return false;
  const first = locator.first();
  if (entry.kind === 'css' && /\[type=["']file["']\]|\[type=file\]/i.test(entry.selector)) {
    return first.evaluate((el) => (el as { type?: string }).type === 'file');
  }
  if (entry.kind === 'role' && entry.role === 'checkbox') {
    return first.evaluate((el) => (el as { type?: string }).type === 'checkbox' || el.getAttribute('role') === 'checkbox');
  }
  if (entry.kind === 'role' && entry.role === 'switch') {
    return first.evaluate((el) => el.getAttribute('role') === 'switch');
  }
  if (entry.kind === 'css' && /^#/.test(entry.selector) && !/\[type=["']file["']\]/.test(entry.selector)) {
    return first.evaluate((el) => el.isConnected);
  }
  return first.isVisible();
}

/** Verify a classified match on the page where it was found. */
export async function verifyMatch(page: Page, match: ClassifiedMatch): Promise<boolean> {
  if (!page.url().startsWith(new URL(match.pageUrl).origin)) {
    await page.goto(match.pageUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  } else if (page.url() !== match.pageUrl) {
    await page.goto(match.pageUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  }
  return verifyEntryOnPage(page, match.entry);
}

/** Verify all matches; return keys that passed and failed. */
export async function verifyMatches(
  page: Page,
  matched: Record<string, ClassifiedMatch>,
): Promise<{ verified: string[]; verifyFailed: string[] }> {
  const verified: string[] = [];
  const verifyFailed: string[] = [];

  for (const [fieldKey, match] of Object.entries(matched)) {
    const ok = await verifyMatch(page, match).catch(() => false);
    if (ok) verified.push(fieldKey);
    else verifyFailed.push(fieldKey);
  }

  return { verified, verifyFailed };
}
