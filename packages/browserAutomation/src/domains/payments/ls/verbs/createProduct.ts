import { lsField } from '@vybekiit/browser-automation/domains/payments/ls/dashboard/fieldLocator';
import { setCheckboxField } from '@vybekiit/browser-automation/domains/payments/ls/dashboard/setCheckbox';
import {
  formatPriceFromCents,
  scrapeProductIdFromUrl,
  scrapeStoreIdFromHtml,
  scrapeVariantIdFromHtml,
} from '@vybekiit/browser-automation/domains/payments/ls/scrape';
import type { LsSetupParams } from '@vybekiit/browser-automation/domains/payments/ls/types';
import type { Page } from 'playwright';

const ORIGIN = 'https://app.lemonsqueezy.com';
// `/products/123` -> match after dashboard product creation.
const PRODUCT_CREATED_URL_PATTERN = /\/products\/\d+/;

export type CreateProductResult = {
  readonly productId: string;
  readonly productUrl: string;
  readonly storeId: string;
  readonly variantId: string;
};

const DEFAULT_DESCRIPTION =
  'Digital product provisioned by VybeKiit. Update this description in your Lemon Squeezy dashboard.';

/**
 * Ignore optional dashboard checkbox failures.
 *
 * @returns Undefined so optional UI toggles can continue safely.
 * @example
 * await setCheckboxField(page, key, true).catch(ignoreOptionalDashboardToggle);
 */
const ignoreOptionalDashboardToggle = (): undefined => undefined;

/**
 * Resolve the product description used by the Lemon Squeezy dashboard.
 *
 * @param params - Setup params collected from CLI flags or wizard.
 * @returns Provided description, or the maintained default description.
 * @example
 * const description = resolveProductDescription(params);
 */
const resolveProductDescription = (params: LsSetupParams): string => {
  if (params.description === undefined || params.description.length === 0) {
    return DEFAULT_DESCRIPTION;
  }

  return params.description;
};

/**
 * Keep an existing id when present, otherwise scrape a fresh id from HTML.
 *
 * @param currentId - Existing id from the initial page scrape.
 * @param scrape - Scraper to run against the refreshed page HTML.
 * @param html - Refreshed page HTML.
 * @returns Existing or freshly scraped id.
 * @example
 * const storeId = keepOrScrapeId(storeId, scrapeStoreIdFromHtml, html);
 */
const keepOrScrapeId = (
  currentId: string | null,
  scrape: (html: string) => string | null,
  html: string,
): string | null => {
  if (currentId !== null) {
    return currentId;
  }

  return scrape(html);
};

/**
 * Create a draft product shell and read its URL/id.
 *
 * @param page - Playwright page to operate on.
 * @returns Product URL and id from the created draft route.
 * @example
 * const draft = await createDraftProduct(page);
 */
const createDraftProduct = async (
  page: Page,
): Promise<{ readonly productId: string; readonly productUrl: string }> => {
  await page.goto(`${ORIGIN}/products`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await (await lsField(page, 'product.createButton')).click({ timeout: 10_000 });
  await page.waitForURL(PRODUCT_CREATED_URL_PATTERN, { timeout: 20_000 });

  const productUrl = page.url();
  const productId = scrapeProductIdFromUrl(productUrl);
  if (productId === null) {
    throw new Error('Product URL did not contain a product id after create');
  }

  return { productId, productUrl };
};

/**
 * Fill the required product fields in the Lemon Squeezy editor.
 *
 * @param page - Playwright page to operate on.
 * @param params - Setup params collected from CLI flags or wizard.
 * @returns Nothing after the required fields are filled.
 * @example
 * await fillProductBasics(page, params);
 */
const fillProductBasics = async (page: Page, params: LsSetupParams): Promise<void> => {
  await (await lsField(page, 'product.nameInput')).fill(params.name);
  await (await lsField(page, 'product.descriptionInput'))
    .first()
    .fill(resolveProductDescription(params));
  await (await lsField(page, 'product.pricing.single.option')).click({ timeout: 8000 });
  await (await lsField(page, 'product.pricing.priceInput')).fill(
    formatPriceFromCents(params.priceCents),
  );
};

/**
 * Apply optional product settings requested by setup params.
 *
 * @param page - Playwright page to operate on.
 * @param params - Setup params collected from CLI flags or wizard.
 * @returns Nothing after optional toggles are attempted.
 * @example
 * await applyProductOptions(page, params);
 */
const applyProductOptions = async (page: Page, params: LsSetupParams): Promise<void> => {
  if (params.licenseKeys === true) {
    await setCheckboxField(page, 'product.settings.licenseKeysToggle', true).catch(
      ignoreOptionalDashboardToggle,
    );
  }
  if (params.hideFromStorefront === true) {
    await setCheckboxField(page, 'product.settings.storefrontDisplayToggle', false).catch(
      ignoreOptionalDashboardToggle,
    );
  }
};

/**
 * Save or publish the product depending on which dashboard action is enabled.
 *
 * @param page - Playwright page to operate on.
 * @returns Nothing after a save/publish attempt and settle wait.
 * @example
 * await saveProductDraft(page);
 */
const saveProductDraft = async (page: Page): Promise<void> => {
  const publish = await lsField(page, 'product.actions.publishButton');
  const saveDraft = await lsField(page, 'product.actions.saveDraftButton');

  if (await publish.isEnabled()) {
    await publish.click({ timeout: 8000 });
  } else if (await saveDraft.isEnabled()) {
    await saveDraft.click({ timeout: 8000 });
  }
  await page.waitForTimeout(1500);
};

/**
 * Scrape store and variant ids from the current product editor HTML.
 *
 * @param page - Playwright page to inspect.
 * @param productId - Product id used to scope variant lookup.
 * @returns Store and variant ids when found.
 * @example
 * const ids = await scrapeProductIds(page, productId);
 */
const scrapeProductIds = async (
  page: Page,
  productId: string,
): Promise<{ readonly storeId: string | null; readonly variantId: string | null }> => {
  const html = await page.content();
  return {
    storeId: scrapeStoreIdFromHtml(html),
    variantId: scrapeVariantIdFromHtml(html, productId),
  };
};

/**
 * Refresh missing product ids after a save/publish action.
 *
 * @param page - Playwright page to inspect.
 * @param productId - Product id used to scope variant lookup.
 * @param currentStoreId - Store id from the initial scrape.
 * @param currentVariantId - Variant id from the initial scrape.
 * @returns Store and variant ids after using fresh HTML for missing values.
 * @example
 * const ids = await refreshMissingProductIds(page, productId, storeId, variantId);
 */
const refreshMissingProductIds = async (
  page: Page,
  productId: string,
  currentStoreId: string | null,
  currentVariantId: string | null,
): Promise<{ readonly storeId: string | null; readonly variantId: string | null }> => {
  const html = await page.content();
  return {
    storeId: keepOrScrapeId(currentStoreId, scrapeStoreIdFromHtml, html),
    variantId: keepOrScrapeId(
      currentVariantId,
      (nextHtml) => scrapeVariantIdFromHtml(nextHtml, productId),
      html,
    ),
  };
};

/**
 * Open an existing product editor and scrape the required Lemon Squeezy ids.
 *
 * @param page - Playwright page to operate on.
 * @param productId - Existing Lemon Squeezy product id.
 * @returns Product URL, product id, store id, and variant id.
 * @example
 * const product = await openExistingProduct(page, '123');
 */
export const openExistingProduct = async (
  page: Page,
  productId: string,
): Promise<CreateProductResult> => {
  const productUrl = `${ORIGIN}/products/${productId}`;
  await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForTimeout(1500);

  const html = await page.content();
  const storeId = scrapeStoreIdFromHtml(html);
  const variantId = scrapeVariantIdFromHtml(html, productId);
  if (storeId === null) {
    throw new Error('Could not scrape store_id from existing product page');
  }
  if (variantId === null) {
    throw new Error('Could not scrape variant_id from existing product page');
  }

  return { productId, productUrl, storeId, variantId };
};

/**
 * Create a single-payment Lemon Squeezy product through the dashboard.
 *
 * @param page - Playwright page to operate on.
 * @param params - Setup params collected from CLI flags or wizard.
 * @returns Product URL, product id, store id, and variant id.
 * @example
 * const product = await createProduct(page, params);
 */
export const createProduct = async (
  page: Page,
  params: LsSetupParams,
): Promise<CreateProductResult> => {
  if (params.reuseProductId !== undefined && params.reuseProductId.length > 0) {
    return openExistingProduct(page, params.reuseProductId);
  }

  const { productId, productUrl } = await createDraftProduct(page);
  await fillProductBasics(page, params);
  await applyProductOptions(page, params);

  const initialIds = await scrapeProductIds(page, productId);
  await saveProductDraft(page);
  const { storeId, variantId } = await refreshMissingProductIds(
    page,
    productId,
    initialIds.storeId,
    initialIds.variantId,
  );
  if (storeId === null) {
    throw new Error('Could not scrape store_id from product page HTML');
  }
  if (variantId === null) {
    throw new Error('Could not scrape variant_id from product page HTML');
  }

  return { productId, productUrl, storeId, variantId };
};
