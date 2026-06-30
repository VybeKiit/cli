import { appConfigSchema, createLogger, parseEnv, resolveDefaultLogLevel } from '@vybekiit/core';

const app = parseEnv(appConfigSchema, {
  APP_URL: import.meta.env.VITE_PUBLIC_APP_URL ?? 'http://localhost:4000',
  NODE_ENV: import.meta.env.MODE === 'production' ? 'production' : 'development',
  LOG_LEVEL: import.meta.env.VITE_PUBLIC_LOG_LEVEL,
});

const level = resolveDefaultLogLevel(app.NODE_ENV, app.LOG_LEVEL);

/** App-wide logger — verbose in development, quiet in production automatically. */
export const log = createLogger('spa', level);
