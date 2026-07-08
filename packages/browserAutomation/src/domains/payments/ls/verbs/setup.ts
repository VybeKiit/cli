import { resolveVerbLogger } from '@vybekiit/browser-automation/core/verbLogger';
import {
  createWebhookViaApi,
  listVariantsForProduct,
} from '@vybekiit/browser-automation/domains/payments/ls/api/provision';
import { connectToLsChrome } from '@vybekiit/browser-automation/domains/payments/ls/connect';
import { ensureTestModeDashboard } from '@vybekiit/browser-automation/domains/payments/ls/dashboard/ensureTestModeDashboard';
import type {
  LsSetupParams,
  LsSetupResult,
  LsVerbContext,
} from '@vybekiit/browser-automation/domains/payments/ls/types';
import { createApiKeyInDashboard } from './createApiKey';
import { createProduct } from './createProduct';
import { uploadProductFiles } from './uploadProductFiles';
import { uploadProductImage } from './uploadProductImage';

// `https://app.lemonsqueezy.com/dashboard` -> match.
const LEMON_SQUEEZY_URL_PATTERN = /lemonsqueezy\.com/;

/**
 * Ignore the optional dashboard URL wait when the page is already usable.
 *
 * @returns Undefined so the setup flow continues to the auth/test-mode checks.
 * @example
 * await page.waitForURL(LEMON_SQUEEZY_URL_PATTERN).catch(ignoreDashboardWaitTimeout);
 */
const ignoreDashboardWaitTimeout = (): undefined => undefined;

/**
 * Provision a Lemon Squeezy store product, API key, and webhook.
 *
 * @param ctx - Runtime verb context from the CLI.
 * @param params - Setup options collected from flags or the wizard.
 * @returns Provisioned identifiers and webhook secret for template env vars.
 * @example
 * const result = await runLsSetup(ctx, params);
 */
export const runLsSetup = async (
  ctx: LsVerbContext,
  params: LsSetupParams,
): Promise<LsSetupResult> => {
  const log = resolveVerbLogger(ctx);
  const session = await connectToLsChrome(ctx);

  try {
    await session.page
      .waitForURL(LEMON_SQUEEZY_URL_PATTERN, { timeout: 20_000 })
      .catch(ignoreDashboardWaitTimeout);

    await ensureTestModeDashboard(session.page, params.mode, log);

    if (params.reuseProductId !== undefined && params.reuseProductId.length > 0) {
      log.log(`[ls] reusing product ${params.reuseProductId} (${params.mode} mode)`);
    } else {
      log.log(`[ls] creating product "${params.name}" (${params.mode} mode)`);
    }
    const product = await createProduct(session.page, params);

    if (params.imagePath !== undefined && params.imagePath.length > 0) {
      log.log(`[ls] uploading product image from ${params.imagePath}`);
      await uploadProductImage(session.page, product.productUrl, params.imagePath);
    }

    if (params.filesPath !== undefined && params.filesPath.length > 0) {
      log.log(`[ls] uploading product files from ${params.filesPath}`);
      await uploadProductFiles(session.page, product.productUrl, params.filesPath);
    }

    const apiKeyName = `${params.name} API`;
    log.log(`[ls] creating API key "${apiKeyName}" in dashboard`);
    const apiKey = await createApiKeyInDashboard(session.page, apiKeyName);

    const resolved = await listVariantsForProduct(apiKey, product.productId);
    const variantId = resolved === null ? product.variantId : resolved.variantId;

    log.log(`[ls] creating webhook via API -> ${params.webhookUrl}`);
    const webhook = await createWebhookViaApi({
      apiKey,
      storeId: product.storeId,
      url: params.webhookUrl,
      events: ['order_created', 'license_key_created'],
      testMode: params.mode === 'test',
    });

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
};
