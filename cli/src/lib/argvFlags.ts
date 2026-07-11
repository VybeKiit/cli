/**
 * Shared argv helpers for CLI commands (`--name=value`, `--name value`, booleans).
 */

/**
 * Read `--name=value` or `--name value` from argv.
 *
 * @param args - CLI argument list.
 * @param name - Flag name without dashes (e.g. `to`, `cwd`).
 * @returns Flag value, or undefined when absent/blank.
 * @example
 * const to = readFlagValue(['--to=./app'], 'to');
 */
export const readFlagValue = (args: readonly string[], name: string): string | undefined => {
  const eqPrefix = `--${name}=`;
  const bare = `--${name}`;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === undefined) {
      // skip hole
    } else if (arg.startsWith(eqPrefix)) {
      // `--to=./app` → `./app`
      const value = arg.slice(eqPrefix.length);
      if (value !== '') {
        return value;
      }
    } else if (arg === bare) {
      // value of `--to <dir>` is the next non-flag token
      const next = args[index + 1];
      if (next !== undefined && !next.startsWith('--') && next !== '') {
        return next;
      }
    }
  }
};

/**
 * True when this token is the value half of a bare `--name` pair for a known value flag.
 *
 * @param args - Full argv list.
 * @param index - Index of the token under test.
 * @param valueNames - Flag names that take a value (without dashes).
 * @returns Whether the previous token is a known value flag.
 * @example
 * const isValue = isValueOfKnownFlag(['--to', './app'], 1, ['to']);
 */
export const isValueOfKnownFlag = (
  args: readonly string[],
  index: number,
  valueNames: readonly string[],
): boolean => {
  if (index === 0) {
    return false;
  }
  // previous token: `--to` makes `./app` a flag value, not a positional
  const prev = args[index - 1];
  if (prev === undefined || !prev.startsWith('--')) {
    return false;
  }
  const name = prev.slice(2);
  return valueNames.includes(name);
};

/**
 * Keep non-flag positionals (drops `--*` and values of bare value-flags).
 *
 * @param args - Full argv list.
 * @param valueNames - Flag names that take a value.
 * @returns Positional leftovers.
 * @example
 * const pos = filterPositionals(['cart', '--to', './app'], ['to']);
 */
export const filterPositionals = (
  args: readonly string[],
  valueNames: readonly string[],
): readonly string[] =>
  args.filter((arg, index) => {
    if (arg.startsWith('--')) {
      return false;
    }
    if (isValueOfKnownFlag(args, index, valueNames)) {
      return false;
    }
    return true;
  });

/**
 * True when argv includes a boolean flag (`--dry-run`).
 *
 * @param args - CLI argument list.
 * @param name - Flag name without dashes (use `dry-run` for `--dry-run`).
 * @returns Whether the flag is present.
 * @example
 * hasBoolFlag(['--dry-run'], 'dry-run'); // true
 */
export const hasBoolFlag = (args: readonly string[], name: string): boolean =>
  args.includes(`--${name}`);
