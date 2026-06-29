import type { VerbContext } from '../types';

import { connectToCwsChrome } from '../connect';
import { MissingItemIdError } from '../errors';
import { discoverDeveloperGroupId, packageUrl } from '../urls';

/**
 * One row of the published-versions table. Captures version string,
 * the date it was published, and the current state of that version
 * (live, rolled back, in review).
 */
export type CwsVersionRow = {
  publishedAt: string;
  status: string;
  version: string;
};

/**
 * Read the version history table for an extension. Lives on `/edit/package`,
 * not `/edit/status` — `/edit/package` is where the dev console renders
 * the historical zips alongside the current draft and any rollback target.
 *
 * Best-effort scrape: walks every `<tr>` on the package tab, pulls the
 * three columns the dev console shows for each row, and returns them in
 * page order (most recent first by convention; we don't sort). Rows
 * with empty cells are filtered out so chrome on the page (e.g. headers,
 * info icons) doesn't pollute the result. Returns `[]` when the table
 * isn't present (a brand-new item with no published versions).
 */
export async function readVersionHistory(ctx: VerbContext): Promise<CwsVersionRow[]> {
  if (!ctx.extension.chromeWebStoreId) {
    throw new MissingItemIdError(ctx.extension.key, 'readVersionHistory');
  }

  const session = await connectToCwsChrome(ctx);
  try {
    const log = ctx.log ?? console;
    log.log(`[cws] reading version history for ${ctx.extension.name}`);

    const groupId = await discoverDeveloperGroupId(session.page);
    await session.page.goto(packageUrl(groupId, ctx.extension.chromeWebStoreId));
    await session.page.waitForTimeout(2500);

    const rows = (await session.page.evaluate(`(() => {
      const text = (el) => (el.innerText || el.textContent || '').trim().replace(/\\s+/g, ' ');
      const packageSectionRows = (body) => {
        const lines = body.split(/\\n+/).map((line) => line.trim()).filter(Boolean);
        const out = [];
        for (const status of ['Draft', 'Published']) {
          const start = lines.findIndex((line) => line.toLowerCase() === status.toLowerCase());
          if (start === -1) continue;
          const rest = lines.slice(start + 1);
          const end = rest.findIndex((line) => ['Draft', 'Published'].some((candidate) => candidate.toLowerCase() === line.toLowerCase()));
          const section = end === -1 ? rest : rest.slice(0, end);
          const versionLine = section.find((line) => /^Version\\s+\\d+\\.\\d+\\.\\d+$/i.test(line));
          const version = versionLine?.match(/(\\d+\\.\\d+\\.\\d+)/)?.[1];
          if (version) out.push({ version, publishedAt: '', status });
        }
        return out;
      };
      const sectionRows = packageSectionRows(document.body.innerText || '');
      if (sectionRows.length > 0) return sectionRows;

      const out = [];
      for (const row of Array.from(document.querySelectorAll('table tbody tr'))) {
        const cells = Array.from(row.querySelectorAll('td')).map((c) => text(c));
        if (cells.length < 2) continue;
        if (!cells.some(Boolean)) continue;
        out.push({
          version: cells[0] || '',
          publishedAt: cells[1] || '',
          status: cells[2] || cells[cells.length - 1] || '',
        });
      }
      return out;
    })()`)) as CwsVersionRow[];

    return rows;
  } finally {
    await session.dispose();
  }
}
