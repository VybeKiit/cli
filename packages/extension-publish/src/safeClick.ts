import type { Locator } from 'playwright';

import { DestructiveClickRefusedError } from './errors';
import { CWS_DESTRUCTIVE_VERB_PATTERN } from './verbRegistry';

/**
 * Regex of accessible-name fragments that mark a button as destructive in
 * the Chrome Web Store dev console UI.
 *
 * Maintenance rule: this regex is the second line of defence below the
 * allowlist (ADR-0012). It must err on the side of false positives — better
 * to refuse a legitimate click than to miss a destructive one. When a new
 * destructive verb appears in the dev console UI, ADD it here; never remove
 * a fragment without an ADR amendment.
 */
const DESTRUCTIVE_NAME_PATTERN = CWS_DESTRUCTIVE_VERB_PATTERN;

/**
 * Click a Playwright locator only if its accessible name does not look
 * destructive. Reads the element's `aria-label` (or its text content as a
 * fallback) before clicking.
 *
 * Why a separate helper instead of inlining `locator.click()`: the
 * destructive-name guard is the universal pre-click check for every push
 * verb. Routing every click through this function makes the safety
 * invariant a single, auditable function call rather than a copy-pasted
 * pattern that someone forgets to apply on the next verb.
 *
 * @param locator The Playwright locator for the element to click.
 * @param verb The verb name making the call (used in the error message so
 *   debugging tells you which verb misresolved).
 * @throws {DestructiveClickRefusedError} when the accessible name matches
 *   {@link DESTRUCTIVE_NAME_PATTERN}.
 */
export async function safeClick(locator: Locator, verb: string): Promise<void> {
  const accessibleName = await readAccessibleName(locator);
  if (DESTRUCTIVE_NAME_PATTERN.test(accessibleName)) {
    throw new DestructiveClickRefusedError(accessibleName, verb);
  }
  await locator.click();
}

/**
 * Read the accessible name of an element. Tries `aria-label`, then the
 * trimmed text content, then an empty string. Empty strings never match the
 * destructive pattern, which is the right default — we'd rather not block a
 * click on an unlabelled element than block every click.
 */
async function readAccessibleName(locator: Locator): Promise<string> {
  const ariaLabel = await locator.getAttribute('aria-label').catch(() => null);
  if (ariaLabel && ariaLabel.trim().length > 0) return ariaLabel.trim();
  const text = await locator.textContent().catch(() => null);
  return text?.trim() ?? '';
}
