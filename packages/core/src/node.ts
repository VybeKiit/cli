import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Load KEY=value pairs from a `.env` file without pulling in dotenv.
 *
 * @param cwd - Directory where the env file should be resolved.
 * @param filename - Env filename relative to `cwd`.
 * @returns Parsed key/value pairs, or an empty object when the file is absent.
 * @example
 * const env = loadEnvFile(process.cwd(), '.env.local');
 */
export const loadEnvFile = (cwd: string, filename = '.env'): Record<string, string> => {
  const path = join(cwd, filename);
  if (!existsSync(path)) {
    return {};
  }
  const out: Record<string, string> = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eq = trimmed.indexOf('=');
      if (eq > 0) {
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
    }
  }
  return out;
};

/**
 * Merge process env values with parsed file values.
 *
 * @param processEnv - Current process environment.
 * @param fileEnv - Parsed env-file values that should win conflicts.
 * @returns A merged environment source with file values taking precedence.
 * @example
 * const env = mergeEnvFile(process.env, loadEnvFile(process.cwd()));
 */
export const mergeEnvFile = (
  processEnv: Record<string, string | undefined>,
  fileEnv: Record<string, string>,
): Record<string, string | undefined> => ({ ...processEnv, ...fileEnv });
