import {
  parseGlobalFlags,
  parseSetupArgs,
  requireNonInteractive,
} from '@vybekiit/browser-automation/cli/flags';
import { describe, expect, it } from 'vitest';

describe('parseGlobalFlags', () => {
  it('extracts --json and --yes', () => {
    const { flags, rest } = parseGlobalFlags(['ls', 'setup', '--json', '--yes', '--name=x']);
    expect(flags.json).toBe(true);
    expect(flags.yes).toBe(true);
    expect(rest).toEqual(['ls', 'setup', '--name=x']);
  });

  it('parses --profile=', () => {
    const { flags } = parseGlobalFlags(['--profile=/tmp/chrome']);
    expect(flags.profile).toBe('/tmp/chrome');
  });
});

describe('requireNonInteractive', () => {
  it('throws in json mode when flags missing', () => {
    expect(() => requireNonInteractive({ json: true, yes: false }, ['name'])).toThrow(
      'Missing required flags',
    );
  });

  it('allows TTY wizard when not json', () => {
    const orig = process.stdout.isTTY;
    Object.defineProperty(process.stdout, 'isTTY', { value: true, configurable: true });
    expect(() => requireNonInteractive({ json: false, yes: false }, ['name'])).not.toThrow();
    Object.defineProperty(process.stdout, 'isTTY', { value: orig, configurable: true });
  });
});

describe('parseSetupArgs', () => {
  it('parses setup flags', () => {
    expect(
      parseSetupArgs([
        '--name=Pro',
        '--price-cents=2900',
        '--mode=test',
        '--webhook-url=https://example.com/hook',
        '--description=Hello',
        '--reuse-product-id=123',
        '--hide-from-storefront',
        '--license-keys',
      ]),
    ).toEqual({
      name: 'Pro',
      priceCents: 2900,
      mode: 'test',
      webhookUrl: 'https://example.com/hook',
      description: 'Hello',
      reuseProductId: '123',
      hideFromStorefront: true,
      licenseKeys: true,
    });
  });
});
