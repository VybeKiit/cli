import { resolveVerbLogger } from '@vybekiit/browser-automation/core/verbLogger';
import { connectToCwsChrome } from '@vybekiit/browser-automation/domains/extension/connect';
import { MissingItemIdError } from '@vybekiit/browser-automation/domains/extension/errors';
import { fieldLocator } from '@vybekiit/browser-automation/domains/extension/locator';
import { safeClick } from '@vybekiit/browser-automation/domains/extension/safeClick';
import type { VerbContext } from '@vybekiit/browser-automation/domains/extension/types';
import {
  discoverDeveloperGroupId,
  listingUrl,
} from '@vybekiit/browser-automation/domains/extension/urls';
import { runVerifyGate } from '@vybekiit/browser-automation/domains/extension/verifyGate';

// review confirmation dialog: "Submit for review" -> match
const REVIEW_CONFIRMATION_DIALOG_PATTERN = /for review/i;

// submit review button: "Submit For Review" -> match
const SUBMIT_FOR_REVIEW_BUTTON_PATTERN = /^Submit For Review$/i;

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
 *
 * @param ctx - Extension automation context with repo paths, auth state, and logging.
 * @returns A promise that resolves after Google confirms the draft was submitted.
 * @example
 * await submitForReview(ctx);
 */
export const submitForReview = async (ctx: VerbContext): Promise<void> => {
  if (!ctx.extension.chromeWebStoreId) {
    throw new MissingItemIdError(ctx.extension.key, 'submitForReview');
  }

  await runVerifyGate(ctx);

  const session = await connectToCwsChrome(ctx);
  try {
    const log = resolveVerbLogger(ctx);
    log.log(`[cws] submitting ${ctx.extension.name} for review`);

    const groupId = await discoverDeveloperGroupId(session.page);
    await session.page.goto(listingUrl(groupId, ctx.extension.chromeWebStoreId));
    await safeClick(fieldLocator(session.page, 'actions.submitReviewButton'), 'submitForReview');

    const confirmationDialog = session.page
      .getByRole('dialog')
      .filter({ hasText: REVIEW_CONFIRMATION_DIALOG_PATTERN })
      .last();
    await confirmationDialog.waitFor({ state: 'visible', timeout: 10_000 });
    await safeClick(
      confirmationDialog.getByRole('button', { name: SUBMIT_FOR_REVIEW_BUTTON_PATTERN }),
      'submitForReview',
    );
    await session.page
      .getByText('Your extension was submitted for review')
      .waitFor({ timeout: 30_000 });
  } finally {
    await session.dispose();
  }
};
