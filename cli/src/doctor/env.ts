import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Load KEY=value pairs from a `.env` file without pulling in dotenv.
 * Used by `vybekiit doctor` to read provider toggles before selecting tools.
 */
export function loadEnvFile(cwd: string): Record<string, string> {
  const path = join(cwd, '.env');
  if (!existsSync(path)) {
    return {};
  }
  const out: Record<string, string> = {};
  const raw = readFileSync(path, 'utf8');
  for (const line of raw.split('\n')) {
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
export function mergeEnv(
  processEnv: Record<string, string | undefined>,
  fileEnv: Record<string, string>,
): Record<string, string | undefined> {
  return { ...processEnv, ...fileEnv };
}

/**
 * Upsert keys into `.env` — updates existing lines or appends new ones. Values are
 * quoted when they contain spaces.
 */
export function writeEnvKeys(cwd: string, keys: Record<string, string>): void {
  const path = join(cwd, '.env');
  const existing = existsSync(path) ? readFileSync(path, 'utf8') : '';
  const lines = existing.length > 0 ? existing.split('\n') : [];
  const written = new Set<string>();

  for (const [key, value] of Object.entries(keys)) {
    const quoted = value.includes(' ') ? `"${value}"` : value;
    const newLine = `${key}=${quoted}`;
    let replaced = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line === undefined) {
        continue;
      }
      const trimmed = line.trim();
      if (trimmed.startsWith(`${key}=`)) {
        lines[i] = newLine;
        replaced = true;
        written.add(key);
        break;
      }
    }
    if (!replaced) {
      lines.push(newLine);
      written.add(key);
    }
  }

  const output = lines.join('\n').replace(/\n*$/, '\n');
  writeFileSync(
    path,
    output.length > 0
      ? output
      : `${Object.entries(keys)
          .map(([k, v]) => `${k}=${v}`)
          .join('\n')}\n`,
  );
}
