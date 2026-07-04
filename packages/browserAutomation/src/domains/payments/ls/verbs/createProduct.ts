import { lsField } from '@vybekiit/browserAutomation/domains/payments/ls/dashboard/fieldLocator';
import { setCheckboxField } from '@vybekiit/browserAutomation/domains/payments/ls/dashboard/setCheckbox';
import {
  formatPriceFromCents,
  scrapeProductIdFromUrl,
  scrapeStoreIdFromHtml,
  scrapeVariantIdFromHtml,
} from '@vybekiit/browserAutomation/domains/payments/ls/scrape';
import type { LsSetupParams } from '@vybekiit/browserAutomation/domains/payments/ls/types';
import type { Page } from 'playwright';

const ORIGIN = 'https://app.lemonsqueezy.com';

export type CreateProductResult = {
  productId: string;
  productUrl: string;
  storeId: string;
  variantId: string;
};

const DEFAULT_DESCRIPTION =
  'Digital product provisioned by VybeKiit. Update this description in your Lemon Squeezy dashboard.';

/** Open an existing product editor and scrape ids (skip create). */
export async function openExistingProduct(
  page: Page,
  productId: string,
): Promise<CreateProductResult> {
  const productUrl = `${ORIGIN}/products/${productId}`;
  await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForTimeout(1500);

  const html = await page.content();
  const storeId = scrapeStoreIdFromHtml(html);
  const variantId = scrapeVariantIdFromHtml(html, productId);
  if (!storeId) throw new Error('Could not scrape store_id from existing product page');
  if (!variantId) throw new Error('Could not scrape variant_id from existing product page');

  return { productId, productUrl, storeId, variantId };
}

/** Create a single-payment product with name, description, and price via the dashboard. */
export async function createProduct(
  page: Page,
  params: LsSetupParams,
): Promise<CreateProductResult> {
  if (params.reuseProductId) {
    return openExistingProduct(page, params.reuseProductId);
  }

  await page.goto(`${ORIGIN}/products`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await (await lsField(page, 'product.createButton')).click({ timeout: 10_000 });
  await page.waitForURL(/\/products\/\d+/, { timeout: 20_000 });

  const productUrl = page.url();
  const productId = scrapeProductIdFromUrl(productUrl);
  if (!productId) throw new Error('Product URL did not contain a product id after create');

  await (await lsField(page, 'product.nameInput')).fill(params.name);
  await (await lsField(page, 'product.descriptionInput'))
    .first()
    .fill(params.description ?? DEFAULT_DESCRIPTION);
  await (await lsField(page, 'product.pricing.single.option')).click({ timeout: 8000 });
  await (await lsField(page, 'product.pricing.priceInput')).fill(
    formatPriceFromCents(params.priceCents),
  );

  if (params.licenseKeys) {
    await setCheckboxField(page, 'product.settings.licenseKeysToggle', true).catch(() => undefined);
  }
  if (params.hideFromStorefront) {
    await setCheckboxField(page, 'product.settings.storefrontDisplayToggle', false).catch(
      () => undefined,
    );
  }

  let html = await page.content();
  let storeId = scrapeStoreIdFromHtml(html);
  let variantId = scrapeVariantIdFromHtml(html, productId);

  const publish = await lsField(page, 'product.actions.publishButton');
  const saveDraft = await lsField(page, 'product.actions.saveDraftButton');

  if (await publish.isEnabled()) {
    await publish.click({ timeout: 8000 });
  } else if (await saveDraft.isEnabled()) {
    await saveDraft.click({ timeout: 8000 });
  }
  await page.waitForTimeout(1500);

  html = await page.content();
  storeId = storeId ?? scrapeStoreIdFromHtml(html);
  variantId = variantId ?? scrapeVariantIdFromHtml(html, productId);

  if (!storeId) throw new Error('Could not scrape store_id from product page HTML');
  if (!variantId) throw new Error('Could not scrape variant_id from product page HTML');

  return { productId, productUrl, storeId, variantId };
}
