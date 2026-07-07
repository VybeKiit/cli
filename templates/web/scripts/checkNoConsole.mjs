#!/usr/bin/env node
/**
 * Fails when debug console calls exist outside tests.
 * Usage: node scripts/checkNoConsole.mjs (from template root)
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const templateRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
// Match direct debug calls while ignoring prose that only names the API.
const debugConsolePattern = String.raw`console\.(log|debug)\s*\(`;
const dirs = ['app', 'src'].map((dir) => join(templateRoot, dir)).filter((dir) => existsSync(dir));
const skippedComponentDirs = [
  'aceternity',
  'ai-elements',
  'blocks',
  'blocks-so',
  'bundui',
  'coss',
  'cult',
  'evilcharts',
  'gluestack',
  'kibo',
  'kokonutui',
  'magicui',
  'prompt-kit',
  'supabase',
  'tailark',
  'untitled',
];
const skippedComponentGlobs = skippedComponentDirs.flatMap((name) => [
  '--glob',
  `!**/components/${name}/**`,
]);

/**
 * Run ripgrep for debug console calls in one directory.
 *
 * @param dir - Directory to scan.
 * @returns Matching file list from ripgrep, or an empty string when none match.
 * @example
 * const matches = scanDirectory('/path/to/src');
 */
const scanDirectory = (dir) => {
  const result = spawnSync(
    'rg',
    [
      debugConsolePattern,
      dir,
      '--glob',
      '!**/*.test.*',
      '--glob',
      '!**/*.md',
      '--glob',
      '!**/scripts/**',
      ...skippedComponentGlobs,
      '-l',
    ],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );

  if (result.status === 0) {
    return result.stdout.trim();
  }

  if (result.status === 1) {
    return '';
  }

  throw new Error(result.stderr.trim() || 'Debug console scan failed.');
};

if (dirs.length === 0) {
  process.stdout.write('No app/ or src/ directories - skipping.\n');
  process.exit(0);
}

for (const dir of dirs) {
  const matches = scanDirectory(dir);
  if (matches.length > 0) {
    process.stderr.write(`Debug console calls found in ${dir}:\n${matches}\n`);
    process.exit(1);
  }
}

process.stdout.write('No debug console calls in configured app directories.\n');
