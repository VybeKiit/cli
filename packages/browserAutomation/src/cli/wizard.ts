import { intro, outro, select, text } from '@clack/prompts';

import type { LsSetupCliArgs } from './flags';

// whole cents: "2900" matches, "29.00" does not
const WHOLE_CENTS_PATTERN = /^\d+$/;

/**
 * Read a prompt result as required text.
 *
 * @param value - Prompt value returned by Clack.
 * @param label - Human label used in the validation error.
 * @returns The trimmed text value.
 * @example
 * const name = requireText('VybeKiit', 'Product name');
 */
const requireText = (value: string | symbol | undefined, label: string): string => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${label} is required`);
  }
  return value;
};

/**
 * Prompt for missing Lemon Squeezy setup arguments.
 *
 * @param partial - Setup arguments already supplied by CLI flags.
 * @returns Complete setup arguments for the Lemon Squeezy setup verb.
 * @example
 * const args = await promptLsSetup({ name: 'VybeKiit' });
 */
export const promptLsSetup = async (partial: Partial<LsSetupCliArgs>): Promise<LsSetupCliArgs> => {
  intro('Lemon Squeezy setup');

  let name = partial.name;
  if (name === undefined) {
    name = requireText(
      await text({
        message: 'Product name',
        validate: (v) => (v?.trim() ? undefined : 'Required'),
      }),
      'Product name',
    );
  }

  let priceCents = partial.priceCents;
  if (priceCents === undefined) {
    priceCents = Number(
      requireText(
        await text({
          message: 'Price (cents)',
          validate: (v) =>
            v && WHOLE_CENTS_PATTERN.test(v) ? undefined : 'Enter a whole number of cents',
        }),
        'Price (cents)',
      ),
    );
  }

  let mode = partial.mode;
  if (mode === undefined) {
    mode = requireText(
      await select({
        message: 'Mode',
        options: [
          { value: 'test', label: 'Test' },
          { value: 'live', label: 'Live' },
        ],
      }),
      'Mode',
    ) as 'test' | 'live';
  }

  let webhookUrl = partial.webhookUrl;
  if (webhookUrl === undefined) {
    webhookUrl = requireText(
      await text({
        message: 'Webhook URL',
        validate: (v) => (v?.startsWith('https://') ? undefined : 'Must be https://'),
      }),
      'Webhook URL',
    );
  }

  outro('Running setup...');
  return {
    name,
    priceCents,
    mode,
    webhookUrl,
    ...(partial.imagePath ? { imagePath: partial.imagePath } : {}),
  };
};
