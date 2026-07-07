import { resolveVerbLogger } from '@vybekiit/browser-automation/core/verbLogger';
import { connectToCwsChrome } from '@vybekiit/browser-automation/domains/extension/connect';
import { MissingItemIdError } from '@vybekiit/browser-automation/domains/extension/errors';
import type { VerbContext } from '@vybekiit/browser-automation/domains/extension/types';
import {
  discoverDeveloperGroupId,
  statusUrl,
} from '@vybekiit/browser-automation/domains/extension/urls';

/**
 * Shape of one violation as scraped from the dev console issues panel.
 * Plain text only — the dev console doesn't expose stable severity codes,
 * so we capture the visible label and let the caller decide what to do
 * with it.
 */
export type CwsViolation = {
  /** Detail text the panel renders below the title. Empty string when none. */
  readonly detail: string;
  /** Severity label as shown on the page (e.g. "Error", "Warning"). */
  readonly severity: string;
  /** Short title, e.g. "Permissions justification missing for `tabs`". */
  readonly title: string;
};

/**
 * Read the issues / violations panel for an extension. Read-only —
 * navigates to `/edit/status`, scrapes the panel, disposes.
 *
 * Best-effort: when the panel isn't present (clean listing or panel
 * is collapsed) returns `[]`. The dev console renders violations as
 * `<li>` rows under a "Violations" or "Issues" heading; we walk those
 * rows when present and pull the visible severity / title / detail.
 *
 * Returns rows in the order the page rendered them so callers can show
 * them faithfully without re-sorting.
 *
 * @param ctx - Extension automation context with repo paths, auth state, and logging.
 * @returns Chrome Web Store violation rows in page-rendered order.
 * @example
 * const violations = await readViolations(ctx);
 */
export const readViolations = async (ctx: VerbContext): Promise<CwsViolation[]> => {
  if (!ctx.extension.chromeWebStoreId) {
    throw new MissingItemIdError(ctx.extension.key, 'readViolations');
  }

  const session = await connectToCwsChrome(ctx);
  try {
    const log = resolveVerbLogger(ctx);
    log.log(`[cws] reading violations for ${ctx.extension.name}`);

    const groupId = await discoverDeveloperGroupId(session.page);
    await session.page.goto(statusUrl(groupId, ctx.extension.chromeWebStoreId));
    await session.page.waitForTimeout(2500);

    const violations = (await session.page.evaluate(`(() => {
      const text = (el) => (el.innerText || el.textContent || '').trim().replace(/\\s+/g, ' ');
      const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4'));
      const target = headings.find((h) => /violations|issues/i.test(text(h)));
      if (!target) return [];
      const container =
        target.closest('section') || target.parentElement?.parentElement || target.parentElement;
      if (!container) return [];
      const rows = Array.from(container.querySelectorAll('li'));
      const out = [];
      for (const row of rows) {
        const t = text(row);
        if (t) {
          const segments = t.split(/\\s—\\s|: /);
          out.push({
            severity: segments[0] || '',
            title: segments[1] || segments[0] || '',
            detail: segments.slice(2).join(': '),
          });
        }
      }
      return out;
    })()`)) as CwsViolation[];

    return violations;
  } finally {
    await session.dispose();
  }
};
