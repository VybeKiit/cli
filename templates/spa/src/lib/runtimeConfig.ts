import { appConfigSchema, parseEnv } from '@vybekiit/core';

const DEFAULT_SPA_API_URL = 'http://localhost:4000';
const appUrl =
  import.meta.env.VITE_PUBLIC_APP_URL === undefined
    ? DEFAULT_SPA_API_URL
    : import.meta.env.VITE_PUBLIC_APP_URL;

/** Schema-decoded runtime settings for the SPA template. */
export const runtimeConfig = parseEnv(appConfigSchema, {
  APP_URL: appUrl,
  NODE_ENV: import.meta.env.MODE === 'production' ? 'production' : 'development',
  LOG_LEVEL: import.meta.env.VITE_PUBLIC_LOG_LEVEL,
});
