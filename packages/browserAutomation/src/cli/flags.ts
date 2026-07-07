export type CliFlags = {
  readonly cdp?: string;
  readonly json: boolean;
  readonly profile?: string;
  readonly yes: boolean;
};

type MutableCliFlags = {
  cdp?: string;
  json: boolean;
  profile?: string;
  yes: boolean;
};

type Mutable<T> = { -readonly [Key in keyof T]: T[Key] };

/**
 * Parse global automation CLI flags from argv.
 *
 * @param argv - Raw CLI arguments after the binary name.
 * @returns Parsed global flags and remaining command arguments.
 * @example
 * const { flags, rest } = parseGlobalFlags(['--json', 'ls', 'setup']);
 */
export const parseGlobalFlags = (
  argv: string[],
): { readonly flags: CliFlags; readonly rest: string[] } => {
  const flags: MutableCliFlags = { json: false, yes: false };
  const rest: string[] = [];

  for (const arg of argv) {
    if (arg === '--json') {
      flags.json = true;
    } else if (arg === '--yes' || arg === '-y') {
      flags.yes = true;
    } else if (arg.startsWith('--profile=')) {
      flags.profile = arg.slice('--profile='.length);
    } else if (arg.startsWith('--cdp=')) {
      flags.cdp = arg.slice('--cdp='.length);
    } else {
      rest.push(arg);
    }
  }

  return { flags, rest };
};

/**
 * Throw when required CLI flags are missing in non-interactive mode.
 *
 * @param flags - Parsed global CLI flags.
 * @param missing - Missing flag names without leading dashes.
 * @returns Nothing when interactive prompting may continue.
 * @example
 * requireNonInteractive({ json: true, yes: false }, ['name']);
 */
export const requireNonInteractive = (flags: CliFlags, missing: string[]): void => {
  if (missing.length === 0) {
    return;
  }

  const hint = missing.map((f) => `--${f}`).join(' ');
  if (flags.json || process.env.CI === '1' || !process.stdout.isTTY) {
    throw new Error(`Missing required flags: ${hint}`);
  }
};

export type LsSetupCliArgs = {
  readonly description?: string;
  readonly filesPath?: string;
  readonly hideFromStorefront?: boolean;
  readonly imagePath?: string;
  readonly licenseKeys?: boolean;
  readonly mode: 'test' | 'live';
  readonly name: string;
  readonly priceCents: number;
  readonly reuseProductId?: string;
  readonly webhookUrl: string;
};

type MutableLsSetupCliArgs = Mutable<LsSetupCliArgs>;

type SetupFlagApplier = (out: Partial<MutableLsSetupCliArgs>, value: string) => void;

const SETUP_FLAG_APPLIERS: Record<string, SetupFlagApplier> = {
  '--description': (out, value) => {
    out.description = value;
  },
  '--files-path': (out, value) => {
    out.filesPath = value;
  },
  '--image-path': (out, value) => {
    out.imagePath = value;
  },
  '--mode': (out, value) => {
    out.mode = value as 'test' | 'live';
  },
  '--name': (out, value) => {
    out.name = value;
  },
  '--price-cents': (out, value) => {
    out.priceCents = Number(value);
  },
  '--reuse-product-id': (out, value) => {
    out.reuseProductId = value;
  },
  '--webhook-url': (out, value) => {
    out.webhookUrl = value;
  },
};

const parseFlagAssignment = (
  arg: string,
): { readonly flag: string; readonly value: string } | undefined => {
  const equalsIndex = arg.indexOf('=');

  if (equalsIndex === -1) {
    return;
  }

  return { flag: arg.slice(0, equalsIndex), value: arg.slice(equalsIndex + 1) };
};

/**
 * Parse Lemon Squeezy setup flags from remaining CLI args.
 *
 * @param rest - Command-specific arguments after global flags and command names.
 * @returns Partial setup args; callers validate required fields before running.
 * @example
 * const args = parseSetupArgs(['--name=Kit', '--price-cents=2900']);
 */
export const parseSetupArgs = (rest: string[]): Partial<LsSetupCliArgs> => {
  const out: Partial<MutableLsSetupCliArgs> = {};
  for (const arg of rest) {
    if (arg === '--hide-from-storefront') {
      out.hideFromStorefront = true;
    } else if (arg === '--license-keys') {
      out.licenseKeys = true;
    } else {
      const assignment = parseFlagAssignment(arg);

      if (assignment !== undefined) {
        const applyFlag = SETUP_FLAG_APPLIERS[assignment.flag];
        if (applyFlag !== undefined) {
          applyFlag(out, assignment.value);
        }
      }
    }
  }
  return out;
};
