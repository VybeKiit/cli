import process from 'node:process';
import {
  type LsSetupCliArgs,
  parseSetupArgs,
  requireNonInteractive,
} from '@vybekiit/browser-automation/cli/flags';
import { printJson, printLine } from '@vybekiit/browser-automation/cli/output';
import type { CommandRegistry } from '@vybekiit/browser-automation/cli/registry';
import { baseVerbContext } from '@vybekiit/browser-automation/cli/verbContext';
import { promptLsSetup } from '@vybekiit/browser-automation/cli/wizard';
import { connectToChrome } from '@vybekiit/browser-automation/core/connect';
import { resolveProfilePath } from '@vybekiit/browser-automation/core/profileResolve';
import { runLsSetup, standbyLogin } from '.';
import { lsSetupEnvBlock, verifyVariantViaApi } from './api/verifyVariant';
import {
  assertLemonSqueezyTestMode,
  verifyMoneyPipeline,
  verifyWebhookCreation,
} from './verifyCheckout';

/**
 * Collect missing required setup flag names.
 *
 * @param partial - Partially parsed setup arguments.
 * @returns Missing setup flag names without leading dashes.
 * @example
 * const missing = missingSetupFlags({ name: 'Kit' });
 */
const missingSetupFlags = (partial: Partial<LsSetupCliArgs>): string[] => {
  const missing: string[] = [];

  if (partial.name === undefined || partial.name.length === 0) {
    missing.push('name');
  }
  if (partial.priceCents === undefined) {
    missing.push('price-cents');
  }
  if (partial.mode === undefined) {
    missing.push('mode');
  }
  if (partial.webhookUrl === undefined || partial.webhookUrl.length === 0) {
    missing.push('webhook-url');
  }

  return missing;
};

/**
 * Build complete setup args after required-field validation.
 *
 * @param partial - Partially parsed setup arguments.
 * @returns Complete setup args for the setup verb.
 * @example
 * const params = completeSetupArgs(parseSetupArgs(args));
 */
const completeSetupArgs = (partial: Partial<LsSetupCliArgs>): LsSetupCliArgs => {
  if (
    partial.name === undefined ||
    partial.priceCents === undefined ||
    partial.mode === undefined ||
    partial.webhookUrl === undefined
  ) {
    throw new Error('Cannot run Lemon Squeezy setup before required flags are resolved.');
  }

  return {
    mode: partial.mode,
    name: partial.name,
    priceCents: partial.priceCents,
    webhookUrl: partial.webhookUrl,
    ...(partial.description === undefined ? {} : { description: partial.description }),
    ...(partial.filesPath === undefined ? {} : { filesPath: partial.filesPath }),
    ...(partial.hideFromStorefront === undefined
      ? {}
      : { hideFromStorefront: partial.hideFromStorefront }),
    ...(partial.imagePath === undefined ? {} : { imagePath: partial.imagePath }),
    ...(partial.licenseKeys === undefined ? {} : { licenseKeys: partial.licenseKeys }),
    ...(partial.reuseProductId === undefined ? {} : { reuseProductId: partial.reuseProductId }),
  };
};

/**
 * Resolve CLI setup params from flags or the interactive wizard.
 *
 * @param partial - Partially parsed setup arguments.
 * @param missing - Missing required setup flag names.
 * @returns Complete setup args for the setup verb.
 * @example
 * const params = await resolveSetupParams(parseSetupArgs(args), ['name']);
 */
const resolveSetupParams = (
  partial: Partial<LsSetupCliArgs>,
  missing: readonly string[],
): Promise<LsSetupCliArgs> => {
  if (missing.length > 0) {
    return promptLsSetup(partial);
  }

  return Promise.resolve(completeSetupArgs(partial));
};

/**
 * Read a `--name=value` or `--name value` flag from raw CLI args.
 *
 * @param args - Raw argument tokens.
 * @param name - Flag name without dashes.
 * @returns The flag value, or undefined when absent.
 * @example
 * const url = readFlag(args, 'url');
 */
const readFlag = (args: readonly string[], name: string): string | undefined => {
  const withEquals = args.find((arg) => arg.startsWith(`--${name}=`));
  if (withEquals !== undefined) {
    return withEquals.slice(name.length + 3);
  }
  const index = args.indexOf(`--${name}`);
  return index >= 0 && index + 1 < args.length ? args[index + 1] : undefined;
};

/**
 * Register the Lemon Squeezy payment automation domain.
 *
 * @param registry - CLI command registry to mutate.
 * @returns Nothing; commands are registered in place.
 * @example
 * registerLsDomain(registry);
 */
export const registerLsDomain = (registry: CommandRegistry): void => {
  registry.register({
    name: 'payments/ls',
    aliases: [],
    commands: {
      standby: {
        description: 'Wait for Lemon Squeezy dashboard after builder sign-in',
        run: async ({ flags }) => {
          const result = await standbyLogin(baseVerbContext(flags));
          if (flags.json) {
            printJson({ ok: result.ready, ...result });
          } else if (result.ready) {
            printLine(`OK: dashboard ready at ${result.url}`);
          } else {
            printLine('Timed out waiting for Lemon Squeezy dashboard sign-in.');
          }
          return result.ready ? 0 : 1;
        },
      },
      setup: {
        description: 'Provision LS product, API key, and webhook',
        run: async ({ args, flags }) => {
          const partial = parseSetupArgs(args);
          const missing = missingSetupFlags(partial);
          requireNonInteractive(flags, missing);

          const params = await resolveSetupParams(partial, missing);

          const result = await runLsSetup(baseVerbContext(flags), params);

          await verifyVariantViaApi(result.apiKey, result.variantId, {
            name: params.name,
            priceCents: params.priceCents,
            mode: params.mode,
          });

          const env = lsSetupEnvBlock(result, params.mode);
          if (flags.json) {
            printJson({
              ok: true,
              env,
              productId: result.productId,
              variantId: result.variantId,
              storeId: result.storeId,
            });
          } else {
            printLine('OK: Lemon Squeezy setup complete.');
            printLine('Write these to .env:');
            for (const [key, value] of Object.entries(env)) {
              printLine(`${key}=${value}`);
            }
          }
          return 0;
        },
      },
      'verify-checkout': {
        description:
          'Verify the money pipeline in test mode: webhook creation + a full fake purchase through the kit checkout UI',
        run: async ({ args, flags }) => {
          const url = readFlag(args, 'url') ?? 'http://localhost:3010/checkout';
          const apiKey = process.env.LEMONSQUEEZY_API_KEY ?? '';
          const guard = await assertLemonSqueezyTestMode(apiKey);
          if (!guard.testMode) {
            if (flags.json) {
              printJson({ ok: false, reason: guard.message });
            } else {
              printLine(`Refusing to run: ${guard.message}`);
            }
            return 1;
          }

          // Webhook leg — without it a paid order never reaches the kit's /api/webhook, so
          // fulfillment/invite never fires (the exact place a vibe coder gets stuck).
          const storeId = process.env.LEMONSQUEEZY_STORE_ID ?? '';
          const webhookUrl = readFlag(args, 'webhook-url') ?? 'https://example.com/api/webhook';
          const webhook =
            storeId.length > 0
              ? await verifyWebhookCreation({ apiKey, storeId, url: webhookUrl })
              : { ok: false, message: 'Set LEMONSQUEEZY_STORE_ID to test webhook creation.' };

          // Checkout leg — a full fake purchase through the UI.
          const ctx = baseVerbContext(flags);
          const profilePath = await resolveProfilePath('ls', ctx.profilePath);
          const session = await connectToChrome({
            ...ctx,
            profileHint: profilePath,
            startUrl: url,
          });
          let checkout: Awaited<ReturnType<typeof verifyMoneyPipeline>>;
          try {
            const github = readFlag(args, 'github');
            const email = readFlag(args, 'email');
            checkout = await verifyMoneyPipeline(session.page, {
              checkoutUrl: url,
              ...(github === undefined ? {} : { githubUsername: github }),
              ...(email === undefined ? {} : { email }),
            });
          } finally {
            await session.dispose();
          }

          const ok = webhook.ok && checkout.ok;
          if (flags.json) {
            printJson({ ok, webhook, checkout });
          } else {
            printLine(`webhook:  ${webhook.ok ? 'OK' : 'FAIL'} - ${webhook.message}`);
            printLine(
              `checkout: ${checkout.ok ? 'OK' : 'FAIL'} [${checkout.stage}] ${checkout.message}`,
            );
            printLine(
              ok
                ? 'Money pipeline verified end to end (test mode).'
                : 'Money pipeline has a gap (see above).',
            );
          }
          return ok ? 0 : 1;
        },
      },
    },
  });
};

/**
 * Register the top-level `ls` alias from the canonical payments domain.
 *
 * @param registry - CLI command registry to mutate.
 * @returns Nothing; alias is registered when the canonical domain exists.
 * @example
 * registerLsTopLevelAlias(registry);
 */
export const registerLsTopLevelAlias = (registry: CommandRegistry): void => {
  const lsDomain = registry.resolveDomain('payments/ls');
  if (lsDomain === undefined) {
    return;
  }

  registry.register({
    name: 'ls',
    aliases: [],
    commands: lsDomain.commands,
  });
};
