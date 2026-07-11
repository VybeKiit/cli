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

/**
 * Fill an Angular Material / `cfc-*` controlled input via the native value setter.
 *
 * Playwright `fill` interleaves characters into Auth Platform `formcontrolname="uri"`
 * fields (e.g. `http://localhost:3030000/0a/…`). The native setter + input/change/blur
 * events sync the Angular control model; we assert `.value` afterward.
 *
 * @param locator - Playwright locator for the input.
 * @param text - Exact text the control must hold.
 * @param timeoutMs - Maximum time to wait for the locator.
 * @returns A promise that resolves after a successful fill and pacing.
 * @example
 * await angularSafeFill(page.locator('input[formcontrolname="uri"]').first(), uri);
 */
export const angularSafeFill = async (
  locator: Locator,
  text: string,
  timeoutMs = 15_000,
): Promise<void> => {
  await locator.waitFor({ state: 'visible', timeout: timeoutMs });
  await locator.evaluate((el, value) => {
    const input = el as HTMLInputElement;
    input.focus();
    const proto = Object.getPrototypeOf(input) as HTMLInputElement;
    const descriptor =
      Object.getOwnPropertyDescriptor(proto, 'value') ??
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    if (descriptor?.set) {
      descriptor.set.call(input, value);
    } else {
      input.value = value;
    }
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
  }, text);

  const actual = await locator.inputValue();
  if (actual !== text) {
    // Fallback: clear then Playwright fill + re-assert (some builds accept fill after clear).
    await locator.fill('');
    await locator.evaluate((el, value) => {
      const input = el as HTMLInputElement;
      const descriptor =
        Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value') ??
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
      if (descriptor?.set) {
        descriptor.set.call(input, value);
      } else {
        input.value = value;
      }
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('blur', { bubbles: true }));
    }, text);
    const retry = await locator.inputValue();
    if (retry !== text) {
      throw new Error(
        `angularSafeFill failed: expected ${JSON.stringify(text)}, got ${JSON.stringify(retry)}`,
      );
    }
  }
  await locator.page().waitForTimeout(resolvePaceMs());
};
