export type CliFlags = {
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
  filesPath?: string;
  imagePath?: string;
  mode: 'test' | 'live';
  name: string;
  priceCents: number;
  webhookUrl: string;
};

export function parseSetupArgs(rest: string[]): Partial<LsSetupCliArgs> {
  const out: Partial<LsSetupCliArgs> = {};
  for (const arg of rest) {
    if (arg.startsWith('--name=')) out.name = arg.slice('--name='.length);
    else if (arg.startsWith('--price-cents='))
      out.priceCents = Number(arg.slice('--price-cents='.length));
    else if (arg.startsWith('--mode=')) out.mode = arg.slice('--mode='.length) as 'test' | 'live';
    else if (arg.startsWith('--webhook-url=')) out.webhookUrl = arg.slice('--webhook-url='.length);
    else if (arg.startsWith('--image-path=')) out.imagePath = arg.slice('--image-path='.length);
    else if (arg.startsWith('--files-path=')) out.filesPath = arg.slice('--files-path='.length);
  }
  return out;
}
