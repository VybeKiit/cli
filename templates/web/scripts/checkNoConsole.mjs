#!/usr/bin/env node
/**
 * Fails when debug console calls exist outside tests — used at go-live / check-safety.
 * Usage: node scripts/checkNoConsole.mjs (from template root)
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const templateRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const pattern = String.raw`console\.(log|debug)`;
const dirs = ['app', 'src'].map((d) => join(templateRoot, d)).filter((d) => existsSync(d));

for (const dir of dirs) {
  try {
    const out = execSync(
      `rg '${pattern}' "${dir}" --glob '!**/*.test.*' --glob '!**/*.md' --glob '!**/scripts/**' -l`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] },
    ).trim();
    if (out) {
      console.error(`Debug console calls found in ${dir}:\n${out}`);
      process.exit(1);
    }
  } catch (error) {
    if (error.status === 1) {
      // rg exit 1 = no matches — good
      continue;
    }
    throw error;
  }
}

if (dirs.length === 0) {
  console.log('No app/ or src/ directories — skipping.');
  process.exit(0);
}

console.log('No debug console calls in app/ or src/.');
