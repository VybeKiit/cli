import * as clack from '@clack/prompts';

import type { LsSetupCliArgs } from './flags';

function requireText(value: string | symbol | undefined, label: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${label} is required`);
  }
  return value;
}

export async function promptLsSetup(partial: Partial<LsSetupCliArgs>): Promise<LsSetupCliArgs> {
  clack.intro('Lemon Squeezy setup');

  const name =
    partial.name ??
    requireText(
      await clack.text({
        message: 'Product name',
        validate: (v) => (v?.trim() ? undefined : 'Required'),
      }),
      'Product name',
    );

  const priceCents =
    partial.priceCents ??
    Number(
      requireText(
        await clack.text({
          message: 'Price (cents)',
          validate: (v) => (v && /^\d+$/.test(v) ? undefined : 'Enter a whole number of cents'),
        }),
        'Price (cents)',
      ),
    );

  const mode =
    partial.mode ??
    (requireText(
      await clack.select({
        message: 'Mode',
        options: [
          { value: 'test', label: 'Test' },
          { value: 'live', label: 'Live' },
        ],
      }),
      'Mode',
    ) as 'test' | 'live');

  const webhookUrl =
    partial.webhookUrl ??
    requireText(
      await clack.text({
        message: 'Webhook URL',
        validate: (v) => (v?.startsWith('https://') ? undefined : 'Must be https://'),
      }),
      'Webhook URL',
    );

  clack.outro('Running setup…');
  const params: LsSetupCliArgs = { name, priceCents, mode, webhookUrl };
  if (partial.imagePath) params.imagePath = partial.imagePath;
  return params;
}
