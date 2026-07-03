import type { Locator } from 'playwright';

const DEFAULT_PACE_MS = 800;
const PACE_ENV_VAR = 'AUTOMATE_PACE_MS';

/** Fixed inter-action delay (ms) — human-paced so dashboards don't flag bot-speed input. */
export function resolvePaceMs(env: NodeJS.ProcessEnv = process.env): number {
  const raw = env[PACE_ENV_VAR];
  if (!raw) return DEFAULT_PACE_MS;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_PACE_MS;
}

/** Wait for a control to be visible, click it, then pause a fixed beat (no reloads). */
export async function pacedClick(locator: Locator, timeoutMs = 15_000): Promise<void> {
  await locator.waitFor({ state: 'visible', timeout: timeoutMs });
  await locator.click({ timeout: timeoutMs });
  await locator.page().waitForTimeout(resolvePaceMs());
}

/** Wait for an input to be visible, fill it, then pause a fixed beat (no reloads). */
export async function pacedFill(locator: Locator, text: string, timeoutMs = 15_000): Promise<void> {
  await locator.waitFor({ state: 'visible', timeout: timeoutMs });
  await locator.fill(text, { timeout: timeoutMs });
  await locator.page().waitForTimeout(resolvePaceMs());
}
