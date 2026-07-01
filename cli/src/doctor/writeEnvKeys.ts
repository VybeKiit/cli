import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

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
