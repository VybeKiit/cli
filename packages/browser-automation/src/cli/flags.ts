export type CliFlags = {
  cdp?: string;
  json: boolean;
  yes: boolean;
  profile?: string;
};

export function parseGlobalFlags(argv: string[]): { flags: CliFlags; rest: string[] } {
  const flags: CliFlags = { json: false, yes: false };
  const rest: string[] = [];

  for (const arg of argv) {
    if (arg === '--json') flags.json = true;
    else if (arg === '--yes' || arg === '-y') flags.yes = true;
    else if (arg.startsWith('--profile=')) flags.profile = arg.slice('--profile='.length);
    else if (arg.startsWith('--cdp=')) flags.cdp = arg.slice('--cdp='.length);
    else rest.push(arg);
  }

  return { flags, rest };
}

export function requireNonInteractive(flags: CliFlags, missing: string[]): void {
  if (missing.length === 0) return;
  const hint = missing.map((f) => `--${f}`).join(' ');
  if (flags.json || process.env.CI === '1' || !process.stdout.isTTY) {
    throw new Error(`Missing required flags: ${hint}`);
  }
}

export type LsSetupCliArgs = {
  description?: string;
  filesPath?: string;
  hideFromStorefront?: boolean;
  imagePath?: string;
  licenseKeys?: boolean;
  mode: 'test' | 'live';
  name: string;
  priceCents: number;
  reuseProductId?: string;
  webhookUrl: string;
};

export function parseSetupArgs(rest: string[]): Partial<LsSetupCliArgs> {
  const out: Partial<LsSetupCliArgs> = {};
  for (const arg of rest) {
    if (arg === '--hide-from-storefront') out.hideFromStorefront = true;
    else if (arg === '--license-keys') out.licenseKeys = true;
    else if (arg.startsWith('--name=')) out.name = arg.slice('--name='.length);
    else if (arg.startsWith('--description=')) out.description = arg.slice('--description='.length);
    else if (arg.startsWith('--price-cents='))
      out.priceCents = Number(arg.slice('--price-cents='.length));
    else if (arg.startsWith('--mode=')) out.mode = arg.slice('--mode='.length) as 'test' | 'live';
    else if (arg.startsWith('--webhook-url=')) out.webhookUrl = arg.slice('--webhook-url='.length);
    else if (arg.startsWith('--image-path=')) out.imagePath = arg.slice('--image-path='.length);
    else if (arg.startsWith('--files-path=')) out.filesPath = arg.slice('--files-path='.length);
    else if (arg.startsWith('--reuse-product-id='))
      out.reuseProductId = arg.slice('--reuse-product-id='.length);
  }
  return out;
}
