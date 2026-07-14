import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// trim any trailing newlines before appending one normalized newline.
const TRAILING_NEWLINES_PATTERN = /\n*$/;

/**
 * Render one `.env` value, quoting values that contain spaces.
 *
 * @param value - Raw env value.
 * @returns Serialized env value.
 * @example
 * const rendered = renderEnvValue('hello world');
 */
const renderEnvValue = (value: string): string => {
  if (value.includes(' ')) {
    return `"${value}"`;
  }
  return value;
};

/**
 * Replace one key in an existing `.env` line array.
 *
 * @param lines - Mutable `.env` lines.
 * @param key - Env key to replace.
 * @param newLine - Serialized replacement line.
 * @returns True when an existing line was replaced.
 * @example
 * const replaced = replaceEnvLine(lines, 'R2_BUCKET', 'R2_BUCKET=assets');
 */
const replaceEnvLine = (lines: string[], key: string, newLine: string): boolean => {
  const index = lines.findIndex((line) => line.trim().startsWith(`${key}=`));
  if (index === -1) {
    return false;
  }
  lines[index] = newLine;
  return true;
};

/**
 * Upsert keys into `.env`; updates existing lines or appends new ones. Values are
 * quoted when they contain spaces.
 *
 * @param cwd - Project directory to update.
 * @param keys - Env keys to upsert.
 * @returns Void after writing `.env`.
 * @example
 * writeEnvKeys(process.cwd(), { STORAGE_PROVIDER: 'r2' });
 */
export const writeEnvKeys = (cwd: string, keys: Record<string, string>): void => {
  const path = join(cwd, '.env');
  const existing = existsSync(path) ? readFileSync(path, 'utf8') : '';
  const lines = existing.length > 0 ? existing.split('\n') : [];

  for (const [key, value] of Object.entries(keys)) {
    const newLine = `${key}=${renderEnvValue(value)}`;
    if (!replaceEnvLine(lines, key, newLine)) {
      lines.push(newLine);
    }
  }

  const output = lines.join('\n').replace(TRAILING_NEWLINES_PATTERN, '\n');
  writeFileSync(
    path,
    output.length > 0
      ? output
      : `${Object.entries(keys)
          .map(([k, v]) => `${k}=${v}`)
          .join('\n')}\n`,
  );
};
