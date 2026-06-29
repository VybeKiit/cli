import { appConfigSchema, createLogger, parseEnv, resolveDefaultLogLevel } from '@vybekiit/core';
import process from 'node:process';

const nodeEnv = process.env.NODE_ENV === 'production' ? 'production' : ('development' as const);
const app = parseEnv(appConfigSchema, { ...process.env, NODE_ENV: nodeEnv });
const level = resolveDefaultLogLevel(app.NODE_ENV, app.LOG_LEVEL);

/** App-wide logger — verbose in development, quiet in production automatically. */
export const log = createLogger('app', level);
