import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// trim trailing newlines: "A=1\n\n" -> "A=1"
const TRAILING_NEWLINES_PATTERN = /\n+$/;

/**
 * Upsert a block of `KEY=value` pairs into a `.env` file at `cwd`, then return only the
 * key names that were written.
 *
 * This is the enforcement point for the "agent never sees the key" guarantee: a provider
 * `setup` mints the secret, calls this to persist it to disk, and surfaces only
 * {@link WriteEnvResult.keysWritten} to the agent transcript — never the values.
 *
 * Existing keys are replaced in place (order preserved); new keys are appended. Values are
 * written verbatim (no quoting) to match the repo's plain `.env` convention.
 */
export type WriteEnvResult = {
  /** Absolute path to the `.env` file that was written. */
  readonly path: string;
  /** The key names persisted (safe to show the agent — no values). */
  readonly keysWritten: string[];
};

const envLineKey = (line: string): string => {
  const equalsIndex = line.indexOf('=');

  if (equalsIndex === -1) {
    return '';
  }

  return line.slice(0, equalsIndex).trim();
};

/**
 * Upsert env values into a `.env` file.
 *
 * @param block - Key-value pairs to write.
 * @param cwd - Directory containing the target `.env` file.
 * @returns The written path and safe key names.
 * @example
 * const result = await writeEnvBlock({ API_KEY: 'secret' }, process.cwd());
 */
export const writeEnvBlock = async (
  block: Readonly<Record<string, string>>,
  cwd: string = process.cwd(),
): Promise<WriteEnvResult> => {
  const envPath = resolve(cwd, '.env');
  const existing = await readFile(envPath, 'utf8').catch(() => '');

  const lines = existing.length > 0 ? existing.split('\n') : [];
  const keysWritten: string[] = [];

  for (const [key, value] of Object.entries(block)) {
    const idx = lines.findIndex((line) => envLineKey(line) === key);
    if (idx >= 0) {
      lines[idx] = `${key}=${value}`;
    } else {
      lines.push(`${key}=${value}`);
    }
    keysWritten.push(key);
  }

  const body = lines.join('\n').replace(TRAILING_NEWLINES_PATTERN, '');
  await writeFile(envPath, `${body}\n`, 'utf8');

  return { path: envPath, keysWritten };
};
