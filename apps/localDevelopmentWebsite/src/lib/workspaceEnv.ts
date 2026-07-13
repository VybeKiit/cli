import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { loadEnvFile, mergeEnvFile } from '@vybekiit/core/node';

/**
 * Walk up from `start` until a monorepo root marker is found.
 *
 * @param start - Directory to start from (usually process.cwd()).
 * @returns Absolute monorepo root or null.
 */
const findMonorepoRoot = (start: string): string | null => {
  let dir = start;
  for (let i = 0; i < 8; i += 1) {
    if (existsSync(resolve(dir, 'pnpm-workspace.yaml'))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  return null;
};

/**
 * Merge process.env with monorepo root `.env` (maintainer console only).
 * process.env wins so CI secrets and shell exports take precedence.
 * Never logs values.
 *
 * @returns Env map for Live work routes.
 * @example
 * const env = loadWorkspaceEnv();
 * env.LEMONSQUEEZY_API_KEY; // from root .env when unset in process
 */
export const loadWorkspaceEnv = (): Record<string, string | undefined> => {
  const root = findMonorepoRoot(process.cwd());
  if (root === null) {
    return { ...process.env };
  }
  const fromFile = loadEnvFile(root, '.env');
  return mergeEnvFile(process.env, fromFile);
};
