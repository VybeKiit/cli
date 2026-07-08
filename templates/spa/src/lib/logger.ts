import { createLogger, resolveDefaultLogLevel } from '@vybekiit/core';
import { runtimeConfig } from '@/lib/runtimeConfig';

const level = resolveDefaultLogLevel(runtimeConfig.NODE_ENV, runtimeConfig.LOG_LEVEL);

/** App-wide logger — verbose in development, quiet in production automatically. */
export const log = createLogger('spa', level);
