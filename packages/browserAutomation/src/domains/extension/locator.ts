import type { Locator, Page } from 'playwright';

import { resolveSelectorEntry, type SelectorEntry } from './selectors';

/**
 * Build a Playwright `Locator` for a named field by looking up its entry in
 * the selector inventory and applying the right resolution strategy.
 *
 * Why this lives in one helper instead of inline in each verb: every verb
 * calls this exactly once per field, and the kind-to-locator mapping is
 * mechanical. Centralising it means a future change to the strategies
 * (e.g. adding an `ariaDescribedBy` kind) is a one-file edit.
 *
 * @throws {SelectorMissingError} if the field has no fresh selector entry
 *   (delegated through `resolveSelectorEntry`).
 */
export function fieldLocator(page: Page, fieldKey: string): Locator {
  const entry = resolveSelectorEntry(fieldKey);
  return locatorFor(page, entry);
}

/**
 * Apply one selector entry to a page. `fieldLocator` is the only caller —
 * kept as a separate function so the `kind`-switch lives next to the type.
 */
function locatorFor(page: Page, entry: SelectorEntry): Locator {
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
