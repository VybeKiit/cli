import { connectToCwsChrome } from '@vybekiit/browserAutomation/domains/extension/connect';
import { MissingItemIdError } from '@vybekiit/browserAutomation/domains/extension/errors';
import { fieldLocator } from '@vybekiit/browserAutomation/domains/extension/locator';
import { safeClick } from '@vybekiit/browserAutomation/domains/extension/safeClick';
import type { VerbContext } from '@vybekiit/browserAutomation/domains/extension/types';
import {
  discoverDeveloperGroupId,
  listingUrl,
} from '@vybekiit/browserAutomation/domains/extension/urls';
import { runVerifyGate } from '@vybekiit/browserAutomation/domains/extension/verifyGate';

/**
 * Submit the current draft to Google's review queue. Push verb — runs
 * the verify gate first.
 *
 * The dev console opens a confirmation dialog after the first click; this
 * verb confirms that modal and waits for Google's success message before
 * returning. Call `readReviewStatus` first when you need to avoid invoking
 * the verb for an item that is already in review.
 *
 * Post-condition: the item is in Google's review queue. There is no
 * undo verb in this package — withdrawing a submission is a destructive
 * action and is on the NEVER list (ADR-0012).
 */
export async function submitForReview(ctx: VerbContext): Promise<void> {
  if (!ctx.extension.chromeWebStoreId) {
    throw new MissingItemIdError(ctx.extension.key, 'submitForReview');
  }

  await runVerifyGate(ctx);

  const session = await connectToCwsChrome(ctx);
  try {
    const log = ctx.log ?? console;
    log.log(`[cws] submitting ${ctx.extension.name} for review`);

    const groupId = await discoverDeveloperGroupId(session.page);
    await session.page.goto(listingUrl(groupId, ctx.extension.chromeWebStoreId));
    await safeClick(fieldLocator(session.page, 'actions.submitReviewButton'), 'submitForReview');

    const confirmationDialog = session.page
      .getByRole('dialog')
      .filter({ hasText: /for review/i })
      .last();
    await confirmationDialog.waitFor({ state: 'visible', timeout: 10_000 });
    await safeClick(
      confirmationDialog.getByRole('button', { name: /^Submit For Review$/i }),
      'submitForReview',
    );
    await session.page
      .getByText('Your extension was submitted for review')
      .waitFor({ timeout: 30_000 });
  } finally {
    await session.dispose();
  }
}
