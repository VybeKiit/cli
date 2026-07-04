import { connectToCwsChrome } from '@vybekiit/browserAutomation/domains/extension/connect';
import { MissingItemIdError } from '@vybekiit/browserAutomation/domains/extension/errors';
import type { VerbContext } from '@vybekiit/browserAutomation/domains/extension/types';
import {
  discoverDeveloperGroupId,
  statusUrl,
} from '@vybekiit/browserAutomation/domains/extension/urls';

/**
 * Shape of the current review status badge on the dev console.
 *
 * Why a discriminated union rather than a single string: callers (agents,
 * CLI prompts) need to branch on whether the listing is currently *in*
 * review (avoid clicking submit again), already published, or rejected.
 * Capturing the label as plain text loses that signal.
 */
export type CwsReviewStatus =
  | { kind: 'draft'; label: string }
  | { kind: 'in_review'; label: string }
  | { kind: 'published'; label: string }
  | { kind: 'rejected'; label: string; reason?: string }
  | { kind: 'unknown'; label: string };

/**
 * Read the current review status for an extension. Read-only, focused —
 * navigates to `/edit/status` only (the full `readListingState` walks
 * five tabs and is overkill when all we want is the badge).
 *
 * The dev console exposes the status as a `Status: <state> - <visibility>`
 * line near the top of the page (e.g. "Status: Published - public",
 * "Status: Draft", "Status: In review"). We parse that line and classify
 * the leading state into the union; unknown labels surface as
 * `{ kind: 'unknown', label }` so Google adding a new state doesn't fail
 * the verb.
 */
export async function readReviewStatus(ctx: VerbContext): Promise<CwsReviewStatus> {
  if (!ctx.extension.chromeWebStoreId) {
    throw new MissingItemIdError(ctx.extension.key, 'readReviewStatus');
  }

  const session = await connectToCwsChrome(ctx);
  try {
    const log = ctx.log ?? console;
    log.log(`[cws] reading review status for ${ctx.extension.name}`);

    const groupId = await discoverDeveloperGroupId(session.page);
    await session.page.goto(statusUrl(groupId, ctx.extension.chromeWebStoreId));

    const label = (await session.page.evaluate(`(() => {
      const text = (document.body.innerText || '');
      const match = text.match(/Status:\\s*([^\\n]+)/);
      return match ? match[1].trim() : '';
    })()`)) as string;

    return classifyReviewLabel(label);
  } finally {
    await session.dispose();
  }
}

function classifyReviewLabel(label: string): CwsReviewStatus {
  const lower = label.toLowerCase();
  if (lower.includes('draft')) return { kind: 'draft', label };
  if (lower.includes('pending review') || lower.includes('in review')) {
    return { kind: 'in_review', label };
  }
  if (lower.includes('published')) return { kind: 'published', label };
  if (lower.includes('rejected') || lower.includes('removed')) {
    return { kind: 'rejected', label };
  }
  return { kind: 'unknown', label };
}
