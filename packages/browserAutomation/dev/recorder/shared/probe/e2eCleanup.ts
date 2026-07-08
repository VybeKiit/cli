import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  LS_FIELD_FALLBACKS,
  locatorFromFallback,
} from '@vybekiit/browser-automation/domains/payments/ls/dashboard/fieldFallbacks';
import type { Page } from 'playwright';
import { LS_E2E_PREFIX, type LsE2eArtifacts, matchesE2ePrefix } from './e2eNames';

const ORIGIN = 'https://app.lemonsqueezy.com';

/** Close slide-out editor panels (description, settings) that block the actions menu. */
export async function dismissProductEditorPanels(page: Page): Promise<void> {
  for (let i = 0; i < 2; i++) {
    await page.keyboard.press('Escape').catch(() => undefined);
    await page.waitForTimeout(200);
  }
  const general = page.locator('a[href*="#"]').filter({ hasText: /^General$/i });
  if ((await general.count()) > 0) {
    await general
      .first()
      .click({ timeout: 8000 })
      .catch(() => undefined);
    await page.waitForTimeout(500);
  }
  await page.mouse.click(24, 320).catch(() => undefined);
  await page.waitForTimeout(400);
}

async function openActionsMenu(page: Page): Promise<void> {
  await dismissProductEditorPanels(page);
  const menu = locatorFromFallback(page, LS_FIELD_FALLBACKS['product.actions.menuTrigger']!);
  if ((await menu.count()) === 0) throw new Error('Actions menu trigger not found');
  try {
    await menu.click({ timeout: 8000 });
  } catch {
    await dismissProductEditorPanels(page);
    await menu.click({ timeout: 8000, force: true });
  }
  await page.waitForTimeout(700);
}

async function clickDeleteMenuItem(page: Page): Promise<void> {
  const dusk = page.locator('[dusk="action-delete"]');
  const menuitem = page.getByRole('menuitem', { name: /delete product|delete/i });
  const button = page.getByRole('button', { name: /delete product/i });

  await dusk
    .or(menuitem)
    .or(button)
    .first()
    .waitFor({ state: 'visible', timeout: 10_000 })
    .catch(() => undefined);

  if ((await dusk.count()) > 0) {
    await dusk.click({ timeout: 8000 });
    return;
  }
  if ((await menuitem.count()) > 0) {
    await menuitem.first().click({ timeout: 8000 });
    return;
  }
  if ((await button.count()) > 0) {
    await button.first().click({ timeout: 8000 });
    return;
  }
  throw new Error('Delete menu item not found');
}

/** Delete the product currently open in the editor via the actions menu. */
export async function deleteProductOnCurrentPage(page: Page): Promise<void> {
  await openActionsMenu(page);
  await clickDeleteMenuItem(page);

  const confirm = page.getByRole('button', { name: /delete|confirm|yes/i });
  if ((await confirm.count()) > 0) await confirm.first().click({ timeout: 8000 });
  await page.waitForTimeout(1000);
  await page.waitForURL(/\/products/, { timeout: 20_000 }).catch(() => undefined);
}

async function deleteProbeProduct(page: Page, name: string): Promise<void> {
  await page.goto(`${ORIGIN}/products`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  const link = page.getByRole('link', {
    name: new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
  });
  if ((await link.count()) === 0) return;

  await link.first().click({ timeout: 8000 });
  await page.waitForURL(/\/products\/\d+/, { timeout: 15_000 });
  await deleteProductOnCurrentPage(page);
}

export async function cleanupE2eArtifacts(page: Page, artifacts: LsE2eArtifacts): Promise<void> {
  console.log(`[ls-probe-e2e] cleaning run ${artifacts.runId}`);
  const deleted = new Set(artifacts.deletedProductNames ?? []);
  for (const name of artifacts.productNames) {
    if (deleted.has(name)) {
      console.log(`  product cleanup (${name}): already deleted in CRUD flow`);
      continue;
    }
    await deleteProbeProduct(page, name).catch((e) =>
      console.log(`  product cleanup (${name}): ${e instanceof Error ? e.message : e}`),
    );
  }
}

export async function cleanupAllE2eByPrefix(page: Page): Promise<void> {
  await page.goto(`${ORIGIN}/products`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  for (const link of await page.getByRole('link').all()) {
    const text = (await link.textContent())?.trim() ?? '';
    if (matchesE2ePrefix(text)) {
      await deleteProbeProduct(page, text).catch(() => undefined);
    }
  }
}

export async function loadLatestE2eArtifacts(logDir: string): Promise<LsE2eArtifacts | null> {
  const files = (await readdir(logDir).catch(() => [])).filter((f) =>
    f.startsWith('ls-e2e-artifacts-'),
  );
  if (files.length === 0) return null;
  files.sort();
  const raw = await readFile(resolve(logDir, files.at(-1)!), 'utf8');
  return JSON.parse(raw) as LsE2eArtifacts;
}

export { LS_E2E_PREFIX };
