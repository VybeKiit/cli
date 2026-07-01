import { connectToLsChrome } from '../connect';
import { createWebhookViaApi, listVariantsForProduct } from '../api/provision';
import { ensureTestModeDashboard } from '../dashboard/ensureTestModeDashboard';
import type { LsSetupParams, LsSetupResult, LsVerbContext } from '../types';
import { createApiKeyInDashboard } from './createApiKey';
import { createProduct } from './createProduct';
import { uploadProductFiles } from './uploadProductFiles';
import { uploadProductImage } from './uploadProductImage';

/** Provision LS store: browser product + image/files, dashboard API key, API webhook. */
export async function runLsSetup(
  ctx: LsVerbContext,
  params: LsSetupParams,
): Promise<LsSetupResult> {
  const log = ctx.log ?? console;
  const session = await connectToLsChrome(ctx);

  try {
    await session.page.waitForURL(/lemonsqueezy\.com/, { timeout: 20_000 }).catch(() => undefined);

    await ensureTestModeDashboard(session.page, params.mode, log);

    if (params.reuseProductId) {
      log.log(`[ls] reusing product ${params.reuseProductId} (${params.mode} mode)`);
    } else {
      log.log(`[ls] creating product "${params.name}" (${params.mode} mode)`);
    }
    const product = await createProduct(session.page, params);

    if (params.imagePath) {
      log.log(`[ls] uploading product image from ${params.imagePath}`);
      await uploadProductImage(session.page, product.productUrl, params.imagePath);
    }

    if (params.filesPath) {
      log.log(`[ls] uploading product files from ${params.filesPath}`);
      await uploadProductFiles(session.page, product.productUrl, params.filesPath);
    }

    const apiKeyName = `${params.name} API`;
    log.log(`[ls] creating API key "${apiKeyName}" in dashboard`);
    const apiKey = await createApiKeyInDashboard(session.page, apiKeyName);

    const resolved = await listVariantsForProduct(apiKey, product.productId);
    const variantId = resolved?.variantId ?? product.variantId;

    log.log(`[ls] creating webhook via API → ${params.webhookUrl}`);
    const webhook = await createWebhookViaApi(
      apiKey,
      product.storeId,
      params.webhookUrl,
      ['order_created', 'license_key_created'],
      params.mode === 'test',
    );

    log.log('[ls] setup complete');
    return {
      apiKey,
      productId: product.productId,
      storeId: product.storeId,
      variantId,
      webhookSecret: webhook.secret,
    };
  } finally {
    await session.dispose();
  }
}
