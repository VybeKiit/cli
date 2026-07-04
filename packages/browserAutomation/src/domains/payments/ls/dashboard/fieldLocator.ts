import { SelectorMissingError } from '@vybekiit/browserAutomation/core/errors';
import type { SelectorEntry } from '@vybekiit/browserAutomation/domains/extension/selectors';
import type { LsDraftFieldKey } from '@vybekiit/browserAutomation/domains/payments/ls/selectors/fields';
import { resolveLsSelectorEntry } from '@vybekiit/browserAutomation/domains/payments/ls/selectors/registry';
import type { Locator, Page } from 'playwright';
import { LS_FIELD_FALLBACKS, type LsFieldFallback, locatorFromFallback } from './fieldFallbacks';

function locatorFromEntry(page: Page, entry: SelectorEntry): Locator {
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

async function isUsable(locator: Locator, entry?: SelectorEntry): Promise<boolean> {
  const count = await locator.count();
  if (count === 0) return false;

  const first = locator.first();
  if (entry?.kind === 'css' && /\[type=["']file["']\]|\[type=file\]/i.test(entry.selector)) {
    return first.evaluate((el) => (el as { type?: string }).type === 'file').catch(() => false);
  }

  if (entry?.kind === 'role' && entry.role === 'checkbox') {
    return first
      .evaluate(
        (el) =>
          el.getAttribute('role') === 'checkbox' || (el as { type?: string }).type === 'checkbox',
      )
      .catch(() => false);
  }

  if (entry?.kind === 'css' && entry.selector.startsWith('[dusk=')) {
    return first.evaluate((el) => el.isConnected).catch(() => false);
  }

  return first.isVisible().catch(() => false);
}

async function fallbackLocator(page: Page, fieldKey: LsDraftFieldKey): Promise<Locator | null> {
  const fallback = LS_FIELD_FALLBACKS[fieldKey];
  if (!fallback) return null;
  const locator = locatorFromFallback(page, fallback);
  if ((await locator.count()) === 0) return null;

  if (fallback.fileInputIndex !== undefined) {
    const ok = await locator
      .evaluate((el) => (el as { type?: string }).type === 'file')
      .catch(() => false);
    return ok ? locator : null;
  }

  if (fallback.role?.role === 'checkbox') {
    const ok = await locator
      .evaluate((el) => el.getAttribute('role') === 'checkbox')
      .catch(() => false);
    return ok ? locator : null;
  }

  if (fallback.css?.startsWith('[dusk=')) {
    const ok = await locator.evaluate((el) => el.isConnected).catch(() => false);
    return ok ? locator : null;
  }

  if (
    await locator
      .first()
      .isVisible()
      .catch(() => false)
  )
    return locator;
  return null;
}

export type LsFieldOptions = {
  log?: Pick<Console, 'log'>;
};

/**
 * Resolve a Playwright locator for an LS field: registry first, then text/role fallback.
 */
export async function lsField(
  page: Page,
  fieldKey: LsDraftFieldKey,
  options: LsFieldOptions = {},
): Promise<Locator> {
  const log = options.log;

  try {
    const entry = resolveLsSelectorEntry(fieldKey);
    const locator = locatorFromEntry(page, entry);
    if (await isUsable(locator, entry)) return locator.first();
  } catch (err) {
    if (!(err instanceof SelectorMissingError)) throw err;
  }

  const fb = await fallbackLocator(page, fieldKey);
  if (fb) {
    log?.log?.(`[ls] field "${fieldKey}" using text/role fallback`);
    return fb.first();
  }

  throw new SelectorMissingError(fieldKey, 'missing');
}

/** Synchronous locator when registry entry is known fresh — prefer {@link lsField} at runtime. */
export function lsFieldLocator(page: Page, fieldKey: LsDraftFieldKey): Locator {
  const entry = resolveLsSelectorEntry(fieldKey);
  return locatorFromEntry(page, entry).first();
}

export { type LsFieldFallback, locatorFromEntry };
