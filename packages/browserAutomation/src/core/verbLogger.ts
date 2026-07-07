export type VerbLogger = {
  readonly error: (...args: readonly unknown[]) => void;
  readonly log: (...args: readonly unknown[]) => void;
  readonly warn: (...args: readonly unknown[]) => void;
};

const formatLogArgs = (args: readonly unknown[]): string =>
  args.map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg))).join(' ');

export const DEFAULT_VERB_LOGGER: VerbLogger = {
  error: (...args) => {
    process.stderr.write(`${formatLogArgs(args)}\n`);
  },
  log: (...args) => {
    process.stdout.write(`${formatLogArgs(args)}\n`);
  },
  warn: (...args) => {
    process.stderr.write(`${formatLogArgs(args)}\n`);
  },
};

/**
 * Resolve the logger for a browser automation verb.
 *
 * @param ctx - Verb context that may provide a custom logger.
 * @returns Custom logger from the context, or the package default logger.
 * @example
 * const log = resolveVerbLogger(ctx);
 */
export const resolveVerbLogger = (ctx: { readonly log?: VerbLogger }): VerbLogger => {
  if (ctx.log !== undefined) {
    return ctx.log;
  }

  return DEFAULT_VERB_LOGGER;
};
