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
 * written verbatim (no quoting) to match the repo's plain `.env` convention. Optional
 * `fileName` targets `.env.local` (or another dotenv file). Optional `removeKeys` drops
 * lines by name (e.g. a stale `CLOUDFLARE_API_TOKEN` that overrides wrangler OAuth).
 */
export type WriteEnvResult = {
  /** Absolute path to the env file that was written. */
  readonly path: string;
  /** The key names upserted (safe to show the agent — no values). */
  readonly keysWritten: string[];
  /** Key names removed when {@link WriteEnvBlockOptions.removeKeys} was set. */
  readonly keysRemoved: string[];
};

/** Options for {@link writeEnvBlock}. */
export type WriteEnvBlockOptions = {
  /** Env file name relative to `cwd` (default `.env`). Use `.env.local` for Next apps. */
  readonly fileName?: string;
  /** Keys to delete entirely (not blanked). Safe for agent transcripts — names only. */
  readonly removeKeys?: readonly string[];
};

const envLineKey = (line: string): string => {
  const equalsIndex = line.indexOf('=');

  if (equalsIndex === -1) {
    return '';
  }

  return line.slice(0, equalsIndex).trim();
};

/**
 * Upsert env values into a dotenv file (default `.env`).
 *
 * @param block - Key-value pairs to write (may be empty when only removing keys).
 * @param cwd - Directory containing the target env file.
 * @param options - Optional file name and keys to remove.
 * @returns The written path and safe key names (written + removed).
 * @example
 * const result = await writeEnvBlock({ API_KEY: 'secret' }, process.cwd());
 * @example
 * await writeEnvBlock(
 *   { LEMONSQUEEZY_TEST_MODE: 'true' },
 *   'apps/landing',
 *   { fileName: '.env.local', removeKeys: ['CLOUDFLARE_API_TOKEN'] },
 * );
 */
export const writeEnvBlock = async (
  block: Readonly<Record<string, string>>,
  cwd: string = process.cwd(),
  options: WriteEnvBlockOptions = {},
): Promise<WriteEnvResult> => {
  const fileName = options.fileName ?? '.env';
  const envPath = resolve(cwd, fileName);
  const existing = await readFile(envPath, 'utf8').catch(() => '');

  let lines = existing.length > 0 ? existing.split('\n') : [];
  const keysWritten: string[] = [];
  const keysRemoved: string[] = [];

  const removeSet = new Set(options.removeKeys ?? []);
  if (removeSet.size > 0) {
    lines = lines.filter((line) => {
      const key = envLineKey(line);
      if (key.length > 0 && removeSet.has(key)) {
        if (!keysRemoved.includes(key)) {
          keysRemoved.push(key);
        }
        return false;
      }
      return true;
    });
  }

  for (const [key, value] of Object.entries(block)) {
    // Drop duplicate assignment lines so a key appears once after upsert.
    const kept: string[] = [];
    let firstIdx = -1;
    for (const line of lines) {
      if (envLineKey(line) === key) {
        if (firstIdx === -1) {
          firstIdx = kept.length;
          kept.push(`${key}=${value}`);
        }
        // skip further duplicates of this key
      } else {
        kept.push(line);
      }
    }
    if (firstIdx === -1) {
      kept.push(`${key}=${value}`);
    }
    lines = kept;
    keysWritten.push(key);
  }

  const body = lines.join('\n').replace(TRAILING_NEWLINES_PATTERN, '');
  await writeFile(envPath, `${body}\n`, 'utf8');

  return { path: envPath, keysWritten, keysRemoved };
};
