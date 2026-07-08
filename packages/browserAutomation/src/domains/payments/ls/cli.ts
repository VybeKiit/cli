import {
  type LsSetupCliArgs,
  parseSetupArgs,
  requireNonInteractive,
} from '@vybekiit/browser-automation/cli/flags';
import { printJson, printLine } from '@vybekiit/browser-automation/cli/output';
import type { CommandRegistry } from '@vybekiit/browser-automation/cli/registry';
import { baseVerbContext } from '@vybekiit/browser-automation/cli/verbContext';
import { promptLsSetup } from '@vybekiit/browser-automation/cli/wizard';
import { runLsSetup, standbyLogin } from '.';
import { lsSetupEnvBlock, verifyVariantViaApi } from './api/verifyVariant';

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
