import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LS_FIELD_FALLBACKS,
  type LsFieldFallback,
  locatorFromFallback,
} from '@vybekiit/browser-automation/domains/payments/ls/dashboard/fieldFallbacks';

import type { LsDraftFieldKey } from '@vybekiit/browser-automation/domains/payments/ls/selectors/fields';
import type { Page } from 'playwright';
import type { ParsedEntry } from '../draft';
import { deleteProductOnCurrentPage, dismissProductEditorPanels } from './e2eCleanup';
import { type LsE2eArtifacts, type LsPricingProbeType, probeProductName } from './e2eNames';
import type { E2eTouchHooks } from './e2eTouch';
import { snapshotPage } from './snapshot';
import type { ClassifiedMatch, PageSnapshot } from './types';
import { verifyEntryOnPage } from './verify';

const ORIGIN = 'https://app.lemonsqueezy.com';
const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
export const PROBE_MEDIA_PATH = resolve(PACKAGE_ROOT, 'dev/recorder/fixtures/ls/probeMedia.png');
export const PROBE_FILE_PATH = resolve(PACKAGE_ROOT, 'dev/recorder/fixtures/ls/probeFile.zip');

const PROBE_DESCRIPTION =
  'VybeKiit probe product — full production selector discovery. Safe to delete.';

const PRICING_OPTION_KEY: Record<LsPricingProbeType, LsDraftFieldKey> = {
  single: 'product.pricing.single.option',
  subscription: 'product.pricing.subscription.option',
  leadMagnet: 'product.pricing.leadMagnet.option',
  payWhatYouWant: 'product.pricing.payWhatYouWant.option',
};

async function pushSnapshot(
  page: Page,
  pages: PageSnapshot[],
  hooks: E2eTouchHooks,
  step: string,
): Promise<void> {
  const snap = await snapshotPage(page);
  pages.push(snap);
  await hooks.onSnapshot?.(snap, step);
}

async function clickPricingType(page: Page, type: LsPricingProbeType): Promise<void> {
  const key = PRICING_OPTION_KEY[type];
  const fallback = LS_FIELD_FALLBACKS[key];
  if (!fallback) throw new Error(`No fallback for ${key}`);
  await locatorFromFallback(page, fallback).first().click({ timeout: 8000 });
}

async function clickProductSection(page: Page, name: string): Promise<void> {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const link = page.locator('a[href*="#"]').filter({ hasText: new RegExp(`^${escaped}$`, 'i') });
  if ((await link.count()) > 0) {
    await link.first().click({ timeout: 8000 });
    await page.waitForTimeout(700);
  }
}

async function clickActionsMenuTrigger(page: Page): Promise<void> {
  await dismissProductEditorPanels(page);
  const menu = locatorFromFallback(page, LS_FIELD_FALLBACKS['product.actions.menuTrigger']!);
  if ((await menu.count()) === 0) throw new Error('Actions menu trigger not found');
  try {
    await menu.click({ timeout: 8000 });
  } catch {
    await dismissProductEditorPanels(page);
    await menu.click({ timeout: 8000, force: true });
  }
}

async function expandSettingsSections(
  page: Page,
  pages: PageSnapshot[],
  hooks: E2eTouchHooks,
): Promise<void> {
  for (const section of ['Settings', 'Confirmation modal', 'Email receipt'] as const) {
    await clickProductSection(page, section);
    await page.waitForTimeout(section === 'Settings' ? 1200 : 700);
    await pushSnapshot(
      page,
      pages,
      hooks,
      `expanded-${section.toLowerCase().replace(/\s+/g, '-')}`,
    );
  }
}

async function scrollAllSections(
  page: Page,
  pages: PageSnapshot[],
  hooks: E2eTouchHooks,
): Promise<void> {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(400);

  await expandSettingsSections(page, pages, hooks);

  for (const step of ['section-confirmation-fields', 'section-email-receipt-fields']) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(400);
    await pushSnapshot(page, pages, hooks, step);
  }

  const addVariant = page.getByRole('button', { name: /add variant/i });
  if ((await addVariant.count()) > 0) {
    await addVariant.click({ timeout: 5000 }).catch(() => undefined);
    await page.waitForTimeout(800);
    await pushSnapshot(page, pages, hooks, 'variants-add-clicked');
  }

  await dismissProductEditorPanels(page);
}

function manualMatch(
  fieldKey: LsDraftFieldKey,
  entry: ParsedEntry,
  pageUrl: string,
): ClassifiedMatch {
  return {
    fieldKey,
    entry,
    pageUrl,
    candidate: {
      tag: 'div',
      role: null,
      ariaLabel: null,
      associatedLabel: null,
      placeholder: null,
      textContent: null,
      href: null,
      type: null,
      id: null,
      nearestHeading: null,
    },
  };
}

function regexToLabelHint(pattern: RegExp): string {
  return pattern.source
    .replace(/\\b|\\i|\\s/g, ' ')
    .replace(/\^|\$/g, '')
    .trim();
}

function parsedEntryFromFallback(fb: LsFieldFallback): ParsedEntry | null {
  if (fb.css) return { kind: 'css', selector: fb.css };
  if (fb.fileInputIndex !== undefined) return { kind: 'css', selector: 'input[type="file"]' };
  if (fb.role) {
    const name = typeof fb.role.name === 'string' ? fb.role.name : regexToLabelHint(fb.role.name);
    return { kind: 'role', role: fb.role.role, name };
  }
  if (fb.label) {
    const text = typeof fb.label === 'string' ? fb.label : regexToLabelHint(fb.label);
    return { kind: 'label', text };
  }
  if (fb.placeholder) {
    const text =
      typeof fb.placeholder === 'string' ? fb.placeholder : regexToLabelHint(fb.placeholder);
    return { kind: 'placeholder', text };
  }
  if (fb.text) {
    const text = typeof fb.text.text === 'string' ? fb.text.text : regexToLabelHint(fb.text.text);
    return { kind: 'css', selector: `text=${text}` };
  }
  return null;
}

async function captureFallbackMatches(
  page: Page,
  pageUrl: string,
  keys: LsDraftFieldKey[],
): Promise<ClassifiedMatch[]> {
  const out: ClassifiedMatch[] = [];
  for (const fieldKey of keys) {
    const fb = LS_FIELD_FALLBACKS[fieldKey];
    if (!fb) continue;
    const entry = parsedEntryFromFallback(fb);
    if (!entry) continue;
    const locator = locatorFromFallback(page, fb);
    if ((await locator.count()) === 0) continue;
    await locator
      .first()
      .scrollIntoViewIfNeeded()
      .catch(() => undefined);
    const ok = await verifyEntryOnPage(page, entry).catch(() => false);
    if (ok) out.push(manualMatch(fieldKey, entry, pageUrl));
  }
  return out;
}

async function appendStableEditorMatches(
  page: Page,
  productUrl: string,
  manualMatches: ClassifiedMatch[],
): Promise<void> {
  const stable: Array<[LsDraftFieldKey, ParsedEntry]> = [
    [
      'product.settings.licenseKeysToggle',
      { kind: 'role', role: 'checkbox', name: 'Generate license keys' },
    ],
    [
      'product.settings.storefrontDisplayToggle',
      { kind: 'role', role: 'checkbox', name: 'Display product on storefront?' },
    ],
    ['product.confirmation.titleInput', { kind: 'css', selector: '#confirmation_title' }],
    [
      'product.confirmation.messageInput',
      { kind: 'css', selector: '#confirmation_title ~ [contenteditable="true"]' },
    ],
    [
      'product.confirmation.buttonTextInput',
      { kind: 'css', selector: '#confirmation_button_text' },
    ],
    ['product.confirmation.buttonLinkInput', { kind: 'css', selector: '#redirect_url' }],
    ['product.emailReceipt.thankYouNoteInput', { kind: 'css', selector: '#thank_you_note' }],
    ['product.emailReceipt.buttonTextInput', { kind: 'css', selector: '#button_text' }],
    ['product.emailReceipt.buttonLinkInput', { kind: 'css', selector: '#button_link' }],
    ['product.actions.menuTrigger', { kind: 'css', selector: '[dusk="actions-menu-trigger"]' }],
    ['product.actions.editMenuItem', { kind: 'css', selector: '[dusk="action-edit"]' }],
    ['product.actions.shareMenuItem', { kind: 'css', selector: '[dusk="action-share"]' }],
    ['product.actions.previewMenuItem', { kind: 'css', selector: '[dusk="action-preview"]' }],
    ['product.actions.unpublishMenuItem', { kind: 'css', selector: '[dusk="action-unpublish"]' }],
    ['product.actions.duplicateMenuItem', { kind: 'css', selector: '[dusk="action-duplicate"]' }],
    ['product.actions.copyToTestModeMenuItem', { kind: 'css', selector: '[dusk="action-copy"]' }],
    ['product.actions.copyIdMenuItem', { kind: 'css', selector: '[dusk="action-copyId"]' }],
    ['product.actions.deleteMenuItem', { kind: 'css', selector: '[dusk="action-delete"]' }],
  ];

  for (const [fieldKey, entry] of stable) {
    const ok = await verifyEntryOnPage(page, entry).catch(() => false);
    if (ok) manualMatches.push(manualMatch(fieldKey, entry, productUrl));
  }
}

async function snapshotActionsMenu(
  page: Page,
  pages: PageSnapshot[],
  hooks: E2eTouchHooks,
  productUrl: string,
  manualMatches: ClassifiedMatch[],
): Promise<void> {
  await clickActionsMenuTrigger(page);
  await page.waitForTimeout(500);
  await pushSnapshot(page, pages, hooks, 'actions-menu-open');

  const menuKeys: LsDraftFieldKey[] = [
    'product.actions.editMenuItem',
    'product.actions.shareMenuItem',
    'product.actions.previewMenuItem',
    'product.actions.unpublishMenuItem',
    'product.actions.duplicateMenuItem',
    'product.actions.copyToTestModeMenuItem',
    'product.actions.copyIdMenuItem',
    'product.actions.deleteMenuItem',
  ];
  manualMatches.push(...(await captureFallbackMatches(page, productUrl, menuKeys)));
  await page.keyboard.press('Escape').catch(() => undefined);
}

function fallbackManualMatches(pageUrl: string, keys: LsDraftFieldKey[]): ClassifiedMatch[] {
  return keys.flatMap((fieldKey) => {
    const fb = LS_FIELD_FALLBACKS[fieldKey];
    if (!fb) return [];
    if (fb.text) {
      return [manualMatch(fieldKey, { kind: 'css', selector: `text=${fb.text.text}` }, pageUrl)];
    }
    if (fb.css) return [manualMatch(fieldKey, { kind: 'css', selector: fb.css }, pageUrl)];
    if (fb.fileInputIndex !== undefined) {
      return [manualMatch(fieldKey, { kind: 'css', selector: 'input[type="file"]' }, pageUrl)];
    }
    return [];
  });
}

async function createProbeProduct(
  page: Page,
  type: LsPricingProbeType,
  runId: string,
  artifacts: LsE2eArtifacts,
  hooks: E2eTouchHooks,
  pages: PageSnapshot[],
  options: { fullEditor?: boolean } = {},
): Promise<ClassifiedMatch[]> {
  const manualMatches: ClassifiedMatch[] = [];
  const productName = probeProductName(type, runId);

  // CREATE
  console.log(`  [crud:${type}] create → ${productName}`);
  await page.goto(`${ORIGIN}/products`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  if (type === 'single') await pushSnapshot(page, pages, hooks, 'product-list');

  await page.getByRole('button', { name: /new product/i }).click({ timeout: 10_000 });
  await page.waitForURL(/\/products\/\d+/, { timeout: 20_000 });
  const productUrl = page.url();
  artifacts.productNames.push(productName);
  artifacts.productUrls.push(productUrl);
  const productId = productUrl.match(/\/products\/(\d+)/)?.[1];
  if (productId) artifacts.productIds.push(productId);

  await page.locator('#input_name').fill(productName);
  await page.locator('[contenteditable=true]').first().fill(PROBE_DESCRIPTION);
  manualMatches.push(
    manualMatch(
      'product.descriptionInput',
      { kind: 'css', selector: '[contenteditable="true"]' },
      productUrl,
    ),
  );
  await pushSnapshot(page, pages, hooks, `${type}-core-fields`);

  // UPDATE — pricing type + panel fields
  console.log(`  [crud:${type}] update pricing panel`);
  await clickPricingType(page, type);
  await page.waitForTimeout(400);
  await pushSnapshot(page, pages, hooks, `${type}-pricing-panel`);

  manualMatches.push(
    ...(await captureFallbackMatches(page, productUrl, [
      PRICING_OPTION_KEY[type],
      'product.pricing.priceInput',
    ])),
  );

  if (type === 'subscription') {
    manualMatches.push(
      ...(await captureFallbackMatches(page, productUrl, [
        'product.pricing.subscription.intervalSelect',
      ])),
    );
  }
  if (type === 'payWhatYouWant') {
    manualMatches.push(
      ...(await captureFallbackMatches(page, productUrl, [
        'product.pricing.payWhatYouWant.minPriceInput',
        'product.pricing.payWhatYouWant.suggestedPriceInput',
      ])),
    );
  }

  if (type !== 'leadMagnet') {
    await page
      .locator('#input_price')
      .fill('9.99')
      .catch(() => undefined);
  }

  if (options.fullEditor) {
    console.log(`  [crud:${type}] update full editor (media, files, settings, confirmation)`);
    await page.locator('input[type="file"]').first().setInputFiles(PROBE_MEDIA_PATH);
    await page.waitForTimeout(1000);
    await pushSnapshot(page, pages, hooks, 'single-media-uploaded');
    manualMatches.push(
      manualMatch(
        'product.media.uploadInput',
        { kind: 'css', selector: 'input[type="file"]' },
        productUrl,
      ),
    );

    await page.locator('input[type="file"]').nth(1).setInputFiles(PROBE_FILE_PATH);
    await page.waitForTimeout(1000);
    await pushSnapshot(page, pages, hooks, 'single-files-uploaded');

    await scrollAllSections(page, pages, hooks);
    await appendStableEditorMatches(page, productUrl, manualMatches);

    manualMatches.push(
      ...(await captureFallbackMatches(page, productUrl, [
        'product.files.uploadInput',
        'product.variants.addButton',
        'product.settings.licenseKeysToggle',
        'product.settings.storefrontDisplayToggle',
        'product.settings.confirmationModalToggle',
        'product.settings.emailReceiptToggle',
        'product.confirmation.titleInput',
        'product.confirmation.messageInput',
        'product.confirmation.buttonTextInput',
        'product.confirmation.buttonLinkInput',
        'product.emailReceipt.thankYouNoteInput',
        'product.emailReceipt.buttonTextInput',
        'product.emailReceipt.buttonLinkInput',
        'product.actions.saveDraftButton',
        'product.actions.publishButton',
        'product.pricing.taxCategorySelect',
        'product.pricing.pricingModelSelect',
      ])),
    );
  }

  const html = await page.content();
  const variantId =
    html.match(/variant_id(?:&quot;|")\s*:\s*(\d+)/)?.[1] ??
    html.match(/"variant_id"\s*:\s*"?(\d+)"?/)?.[1];
  if (variantId && type === 'single') {
    artifacts.variantId = variantId;
    manualMatches.push(
      manualMatch('dashboard.variantId', { kind: 'css', selector: '#input_name' }, productUrl),
    );
  }

  const saveDraft = page.getByRole('button', { name: /save as draft/i });
  if ((await saveDraft.count()) > 0 && (await saveDraft.isEnabled())) {
    await saveDraft.click({ timeout: 8000 }).catch(() => undefined);
    await page.waitForTimeout(800);
    await pushSnapshot(page, pages, hooks, `${type}-saved-draft`);
  }

  if (options.fullEditor) {
    await snapshotActionsMenu(page, pages, hooks, productUrl, manualMatches);
  }

  // READ — final snapshot before delete
  console.log(`  [crud:${type}] read pre-delete snapshot`);
  await pushSnapshot(page, pages, hooks, `${type}-pre-delete`);

  // DELETE — last step on this product
  console.log(`  [crud:${type}] delete`);
  await deleteProductOnCurrentPage(page);
  artifacts.deletedProductNames.push(productName);
  await pushSnapshot(page, pages, hooks, `${type}-deleted`);

  return manualMatches;
}

/** Create four probe products — one per pricing type; single gets full editor scroll. */
export async function runFourProductProbe(
  page: Page,
  artifacts: LsE2eArtifacts,
  hooks: E2eTouchHooks,
  pages: PageSnapshot[],
): Promise<ClassifiedMatch[]> {
  const all: ClassifiedMatch[] = [];
  const types: LsPricingProbeType[] = ['single', 'subscription', 'leadMagnet', 'payWhatYouWant'];

  for (const type of types) {
    const matches = await createProbeProduct(page, type, artifacts.runId, artifacts, hooks, pages, {
      fullEditor: type === 'single',
    });
    all.push(...matches);
  }

  return all;
}
