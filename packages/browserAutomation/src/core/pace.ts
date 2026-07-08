import type { Locator } from 'playwright';

const DEFAULT_PACE_MS = 800;
const PACE_ENV_VAR = 'AUTOMATE_PACE_MS';

/**
 * Resolve the fixed inter-action delay in milliseconds.
 *
 * @param env - Environment object to read `AUTOMATE_PACE_MS` from.
 * @returns A non-negative delay, defaulting to the package pacing constant.
 * @example
 * const delayMs = resolvePaceMs({ AUTOMATE_PACE_MS: '1000' } as NodeJS.ProcessEnv);
 */
export const resolvePaceMs = (env: NodeJS.ProcessEnv = process.env): number => {
  const raw = env[PACE_ENV_VAR];
  if (!raw) {
    return DEFAULT_PACE_MS;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_PACE_MS;
};

/**
 * Wait for a control to be visible, click it, then pause briefly.
 *
 * @param locator - Playwright locator to click.
 * @param timeoutMs - Maximum time to wait for the locator.
 * @returns A promise that resolves after the click and pacing delay.
 * @example
 * await pacedClick(page.getByRole('button', { name: 'Save' }));
 */
export const pacedClick = async (locator: Locator, timeoutMs = 15_000): Promise<void> => {
  await locator.waitFor({ state: 'visible', timeout: timeoutMs });
  await locator.click({ timeout: timeoutMs });
  await locator.page().waitForTimeout(resolvePaceMs());
};

/**
 * Click by dispatching a DOM `click` event instead of a real pointer gesture.
 *
 * Some consoles float a transparent overlay that intercepts pointer hit-testing.
 * A dispatched event reaches the element directly while still using framework handlers.
 *
 * @param locator - Playwright locator to dispatch the click on.
 * @param timeoutMs - Maximum time to wait for the locator.
 * @returns A promise that resolves after the dispatched click and pacing delay.
 * @example
 * await pacedDispatchClick(page.getByText('Continue'));
 */
export const pacedDispatchClick = async (locator: Locator, timeoutMs = 15_000): Promise<void> => {
  await locator.waitFor({ state: 'attached', timeout: timeoutMs });
  await locator.dispatchEvent('click');
  await locator.page().waitForTimeout(resolvePaceMs());
};

/**
 * Wait for an input to be visible, fill it, then pause briefly.
 *
 * @param locator - Playwright locator for the input.
 * @param text - Text to fill.
 * @param timeoutMs - Maximum time to wait for the locator.
 * @returns A promise that resolves after filling and pacing.
 * @example
 * await pacedFill(page.getByLabel('Name'), 'VybeKiit');
 */
export const pacedFill = async (
  locator: Locator,
  text: string,
  timeoutMs = 15_000,
): Promise<void> => {
  await locator.waitFor({ state: 'visible', timeout: timeoutMs });
  await locator.fill(text, { timeout: timeoutMs });
  await locator.page().waitForTimeout(resolvePaceMs());
};
