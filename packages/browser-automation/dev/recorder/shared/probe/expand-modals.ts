import type { Page } from 'playwright';

import { clickSectionCreate } from '../../../../src/domains/payments/ls/dashboard/clickSectionCreate';
import { waitForDialogInputs } from '../../../../src/domains/payments/ls/dashboard/waitForDialogInputs';
import { snapshotPage } from './snapshot';
import type { PageSnapshot } from './types';

const ORIGIN = 'https://app.lemonsqueezy.com';

export type ModalExpandResult = {
  modalPages: PageSnapshot[];
  steps: { id: string; ok: boolean; error?: string }[];
};

export type ModalExpandHooks = {
  /** Called while dialog/page is still open — use for immediate verify. */
  onSnapshot?: (snap: PageSnapshot) => Promise<void>;
};

async function dismissOverlays(page: Page): Promise<void> {
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(250);
}

export { clickSectionCreate as clickSectionCreateButton, waitForDialogInputs };

/**
 * Open LS create dialogs to expose form fields — opens triggers only, never Save/Create submit.
 */
export async function expandModals(page: Page, hooks: ModalExpandHooks = {}): Promise<ModalExpandResult> {
  const modalPages: PageSnapshot[] = [];
  const steps: ModalExpandResult['steps'] = [];

  const runStep = async (id: string, fn: () => Promise<void>): Promise<void> => {
    try {
      await fn();
      const snap = await snapshotPage(page);
      modalPages.push(snap);
      await hooks.onSnapshot?.(snap);
      steps.push({ id, ok: true });
    } catch (err) {
      steps.push({ id, ok: false, error: err instanceof Error ? err.message : String(err) });
    } finally {
      await dismissOverlays(page);
    }
  };

  await runStep('product-create-modal', async () => {
    await page.goto(`${ORIGIN}/products`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.getByRole('button', { name: /new product/i }).click({ timeout: 10_000 });
    await page.waitForURL(/\/products\//, { timeout: 15_000 }).catch(() => waitForDialogInputs(page));
    await page.waitForTimeout(400);
  });

  await runStep('api-key-create-modal', async () => {
    await page.goto(`${ORIGIN}/settings/api`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    const clicked =
      (await clickSectionCreate(page, 'API keys')) ||
      (await page
        .getByRole('button', { name: /create api|new api|add api/i })
        .first()
        .click({ timeout: 3_000 })
        .then(() => true)
        .catch(() => false));
    if (!clicked) throw new Error('Could not find API key create trigger');
    await waitForDialogInputs(page);
    await page.waitForTimeout(400);
  });

  await runStep('webhook-create-modal', async () => {
    await page.goto(`${ORIGIN}/settings/webhooks`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    const clicked =
      (await clickSectionCreate(page, 'Webhooks')) ||
      (await page
        .getByRole('button', { name: /add webhook|new webhook|create webhook/i })
        .first()
        .click({ timeout: 3_000 })
        .then(() => true)
        .catch(() => false));
    if (!clicked) throw new Error('Could not find webhook create trigger');
    await waitForDialogInputs(page);
    await page.waitForTimeout(400);
  });

  await runStep('stores-settings-scrape', async () => {
    await page.goto(`${ORIGIN}/settings/stores`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(500);
  });

  return { modalPages, steps };
}
