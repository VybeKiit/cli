/**
 * Env-gated logger — verbose in development, quiet in production.
 *
 * Why not pino/winston: zero extra deps, works in Edge/workers, and the kit
 * targets vibe coders who should never configure logging. {@link resolveDefaultLogLevel}
 * reads `NODE_ENV` + optional `LOG_LEVEL` from {@link appConfigSchema}.
 */

/** Ordered severity — higher number = more important. */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

/** A scoped logger with optional child context (e.g. request id). */
export interface Logger {
  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
  /** Returns a logger that prefixes every line with extra context fields. */
  child(context: Record<string, unknown>): Logger;
}

export interface CreateLoggerOptions {
  readonly scope: string;
  readonly level: LogLevel;
  readonly context?: Record<string, unknown>;
}

/**
 * Default minimum level from environment — production stays quiet unless overridden.
 *
 * @param nodeEnv - parsed `NODE_ENV`
 * @param logLevel - optional explicit `LOG_LEVEL` from `.env`
 */
export function resolveDefaultLogLevel(
  nodeEnv: 'development' | 'production',
  logLevel?: LogLevel,
): LogLevel {
  if (logLevel !== undefined) return logLevel;
  return nodeEnv === 'production' ? 'warn' : 'debug';
}

function shouldLog(minLevel: LogLevel, messageLevel: LogLevel): boolean {
  return LEVEL_RANK[messageLevel] >= LEVEL_RANK[minLevel] && minLevel !== 'silent';
}

function formatPrefix(scope: string, context?: Record<string, unknown>): string {
  const ctx = context && Object.keys(context).length > 0 ? ` ${JSON.stringify(context)}` : '';
  return `[${scope}]${ctx}`;
}

function write(level: LogLevel, prefix: string, args: unknown[]): void {
  const line = [prefix, ...args];
  if (level === 'error') {
    console.error(...line);
    return;
  }
  if (level === 'warn') {
    console.warn(...line);
    return;
  }
  console.log(...line);
}

/**
 * Create a level-gated logger for a scope (e.g. `'app'`, `'api/contact'`).
 *
 * @param scope - short label printed on every line
 * @param level - minimum level to emit (from {@link resolveDefaultLogLevel})
 */
export function createLogger(scope: string, level: LogLevel): Logger {
  return buildLogger({ scope, level });
}

function buildLogger(options: CreateLoggerOptions): Logger {
  const prefix = formatPrefix(options.scope, options.context);

  const logAt =
    (messageLevel: LogLevel) =>
    (...args: unknown[]): void => {
      if (shouldLog(options.level, messageLevel)) {
        write(messageLevel, prefix, args);
      }
    };

  return {
    debug: logAt('debug'),
    info: logAt('info'),
    warn: logAt('warn'),
    error: logAt('error'),
    child(context: Record<string, unknown>): Logger {
      return buildLogger({
        scope: options.scope,
        level: options.level,
        context: { ...options.context, ...context },
      });
    },
  };
}
