/**
 * Env-gated logger — verbose in development, quiet in production.
 *
 * Why not pino/winston: zero extra deps, works in Edge/workers, and the kit
 * targets vibe coders who should never configure logging. {@link resolveDefaultLogLevel}
 * reads `NODE_ENV` + optional `LOG_LEVEL` from {@link appConfigSchema}.
 */

/** Ordered severity — higher number = more important. */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

/** Console-compatible sink used by the core logger. */
type LogSink = Pick<Console, 'error' | 'log' | 'warn'>;

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

/** A scoped logger with optional child context (e.g. request id). */
export type Logger = {
  readonly debug: (...args: unknown[]) => void;
  readonly info: (...args: unknown[]) => void;
  readonly warn: (...args: unknown[]) => void;
  readonly error: (...args: unknown[]) => void;
  /** Returns a logger that prefixes every line with extra context fields. */
  readonly child: (context: Record<string, unknown>) => Logger;
};

/** Options for scoped logger creation. */
export type CreateLoggerOptions = {
  readonly scope: string;
  readonly level: LogLevel;
  readonly context?: Record<string, unknown>;
};

type BuildLoggerOptions = CreateLoggerOptions & {
  readonly sink?: LogSink;
};

const DEFAULT_LOG_SINK: LogSink = globalThis.console;

/**
 * Default minimum level from environment — production stays quiet unless overridden.
 *
 * @param nodeEnv - parsed `NODE_ENV`
 * @param logLevel - optional explicit `LOG_LEVEL` from `.env`
 * @returns The minimum level to emit.
 * @example
 * const level = resolveDefaultLogLevel('production');
 */
export const resolveDefaultLogLevel = (
  nodeEnv: 'development' | 'production',
  logLevel?: LogLevel,
): LogLevel => {
  if (logLevel !== undefined) {
    return logLevel;
  }
  return nodeEnv === 'production' ? 'warn' : 'debug';
};

/**
 * Decide whether a message level should emit for a minimum level.
 *
 * @param minLevel - Configured minimum log level.
 * @param messageLevel - Level of the message being written.
 * @returns Whether the message should be printed.
 * @example
 * const enabled = shouldLog('info', 'warn');
 */
const shouldLog = (minLevel: LogLevel, messageLevel: LogLevel): boolean =>
  LEVEL_RANK[messageLevel] >= LEVEL_RANK[minLevel] && minLevel !== 'silent';

/**
 * Format the logger prefix for a scope and optional context.
 *
 * @param scope - Short source label printed on every line.
 * @param context - Optional structured fields appended to the prefix.
 * @returns Formatted prefix string.
 * @example
 * const prefix = formatPrefix('api', { requestId: 'abc' });
 */
const formatPrefix = (scope: string, context?: Record<string, unknown>): string => {
  const ctx = context && Object.keys(context).length > 0 ? ` ${JSON.stringify(context)}` : '';
  return `[${scope}]${ctx}`;
};

/**
 * Write one formatted log line to the correct console method.
 *
 * @param level - Message level being emitted.
 * @param prefix - Logger prefix built from scope and context.
 * @param args - User-provided log arguments.
 * @returns Nothing; writes to the configured sink.
 * @example
 * write('warn', '[api]', ['slow request']);
 */
const write = (level: LogLevel, prefix: string, args: unknown[], sink: LogSink): void => {
  const line = [prefix, ...args];
  if (level === 'error') {
    sink.error(...line);
    return;
  }
  if (level === 'warn') {
    sink.warn(...line);
    return;
  }
  sink.log(...line);
};

/**
 * Create a level-gated logger for a scope (e.g. `'app'`, `'api/contact'`).
 *
 * @param scope - short label printed on every line
 * @param level - minimum level to emit (from {@link resolveDefaultLogLevel})
 * @returns A scoped logger with `debug`, `info`, `warn`, `error`, and `child`.
 * @example
 * const logger = createLogger('api', 'info');
 */
export const createLogger = (scope: string, level: LogLevel): Logger =>
  buildLogger({ scope, level });

/**
 * Build a logger from fully resolved options.
 *
 * @param options - Logger options including scope, level, and optional context.
 * @returns A logger that writes messages at or above the configured level.
 * @example
 * const logger = buildLogger({ scope: 'api', level: 'debug' });
 */
const buildLogger = (options: BuildLoggerOptions): Logger => {
  const prefix = formatPrefix(options.scope, options.context);
  const sink = options.sink === undefined ? DEFAULT_LOG_SINK : options.sink;

  const logAt =
    (messageLevel: LogLevel) =>
    (...args: unknown[]): void => {
      if (shouldLog(options.level, messageLevel)) {
        write(messageLevel, prefix, args, sink);
      }
    };

  return {
    debug: logAt('debug'),
    info: logAt('info'),
    warn: logAt('warn'),
    error: logAt('error'),
    child: (context: Record<string, unknown>): Logger =>
      buildLogger({
        scope: options.scope,
        level: options.level,
        sink,
        context:
          options.context === undefined ? { ...context } : { ...options.context, ...context },
      }),
  };
};
