import { appConfigSchema, createLogger, parseEnv, resolveDefaultLogLevel } from '@vybekiit/core';
import { readNodeEnv } from '@/lib/nodeEnv';

const app = parseEnv(appConfigSchema, readNodeEnv());
const level = resolveDefaultLogLevel(app.NODE_ENV, app.LOG_LEVEL);

/** App-wide logger — verbose in development, quiet in production automatically. */
export const log = createLogger('app', level);
