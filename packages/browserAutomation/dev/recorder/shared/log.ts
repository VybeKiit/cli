import { appendFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const LOGS_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../logs');

export async function appendRecorderLog(domain: string, message: string): Promise<void> {
  await mkdir(LOGS_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const path = resolve(LOGS_DIR, `${domain}-${stamp}.log`);
  const line = `[${new Date().toISOString()}] ${message}\n`;
  await appendFile(path, line, 'utf8');
}
