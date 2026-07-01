import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Load KEY=value pairs from a `.env` file without pulling in dotenv.
 * Shared by doctor, infra scripts, and CLI helpers.
 */
export function loadEnvFile(cwd: string, filename = '.env'): Record<string, string> {
  const path = join(cwd, filename);
  if (!existsSync(path)) {
    return {};
  }
  const out: Record<string, string> = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const eq = trimmed.indexOf('=');
    if (eq <= 0) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

/** Merge process.env with a parsed `.env` file (file wins on conflict). */
export function mergeEnvFile(
  processEnv: Record<string, string | undefined>,
  fileEnv: Record<string, string>,
): Record<string, string | undefined> {
  return { ...processEnv, ...fileEnv };
}
