import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

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
export interface WriteEnvResult {
  /** Absolute path to the `.env` file that was written. */
  readonly path: string;
  /** The key names persisted (safe to show the agent — no values). */
  readonly keysWritten: string[];
}

export async function writeEnvBlock(
  block: Readonly<Record<string, string>>,
  cwd: string = process.cwd(),
): Promise<WriteEnvResult> {
  const envPath = resolve(cwd, '.env');
  const existing = await readFile(envPath, 'utf8').catch(() => '');

  const lines = existing.length > 0 ? existing.split('\n') : [];
  const keys = Object.keys(block);

  for (const key of keys) {
    const value = block[key] ?? '';
    const idx = lines.findIndex((line) => line.match(new RegExp(`^\\s*${key}\\s*=`)));
    if (idx >= 0) {
      lines[idx] = `${key}=${value}`;
    } else {
      lines.push(`${key}=${value}`);
    }
  }

  // Normalize to exactly one trailing newline.
  const body = lines.join('\n').replace(/\n+$/, '');
  await writeFile(envPath, `${body}\n`, 'utf8');

  return { path: envPath, keysWritten: keys };
}
