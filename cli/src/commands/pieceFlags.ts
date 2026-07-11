import { filterPositionals, hasBoolFlag, readFlagValue } from '../lib/argvFlags';

/** Parsed flags shared by list/add piece commands. */
export type PieceFlags = {
  readonly dryRun: boolean;
  readonly force: boolean;
  readonly json: boolean;
  readonly to?: string;
  readonly kind?: string;
  readonly positionals: readonly string[];
};

const VALUE_FLAGS = ['to', 'kind'] as const;

/**
 * Parse common install flags from argv.
 *
 * @param args - CLI arguments after the piece id (or full rest for list).
 * @returns Parsed flags and positional leftovers.
 * @example
 * const flags = parsePieceFlags(['cart', '--to=./app', '--dry-run']);
 */
export const parsePieceFlags = (args: readonly string[]): PieceFlags => {
  const to = readFlagValue(args, 'to');
  const kind = readFlagValue(args, 'kind');
  const positionals = filterPositionals(args, VALUE_FLAGS);

  return {
    dryRun: hasBoolFlag(args, 'dry-run'),
    force: hasBoolFlag(args, 'force'),
    json: hasBoolFlag(args, 'json'),
    ...(to === undefined ? {} : { to }),
    ...(kind === undefined ? {} : { kind }),
    positionals,
  };
};
