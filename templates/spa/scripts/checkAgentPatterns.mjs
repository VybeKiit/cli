#!/usr/bin/env node
/**
 * Mechanical agent-pattern checks for this template.
 * Usage: node scripts/checkAgentPatterns.mjs [--root .] [--strict]
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const BANNED_IN_COPY = [
  'Stripe',
  'PayPal',
  'Supabase',
  'Sentry',
  'PostHog',
  'Twilio',
  'Better Auth',
  'Resend',
  'Vercel',
  'Wrangler',
];

const templateRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const rootIdx = args.indexOf('--root');
const root = rootIdx >= 0 ? args[rootIdx + 1] : templateRoot;
const strict = args.includes('--strict');

const skippedDirs = new Set(['node_modules', '.next', 'dist', '.output']);

const writeErrorLine = (line) => {
  process.stderr.write(`${line}\n`);
};

const walk = (dir, acc = []) => {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return acc;
  }
  for (const name of entries) {
    if (!skippedDirs.has(name)) {
      const path = join(dir, name);
      const st = statSync(path);
      if (st.isDirectory()) {
        walk(path, acc);
      } else {
        acc.push(path);
      }
    }
  }
  return acc;
};

const stripSourceComments = (text) =>
  text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

const collectScanFiles = (scanRoot) => {
  const files = [];
  const jsonPath = join(scanRoot, 'messages/en.json');
  try {
    if (statSync(jsonPath).isFile()) {
      files.push(jsonPath);
    }
  } catch {
    // optional per template
  }
  const appPath = join(scanRoot, 'app');
  try {
    if (statSync(appPath).isDirectory()) {
      files.push(...walk(appPath).filter((f) => f.endsWith('.tsx') || f.endsWith('.jsx')));
    }
  } catch {
    // optional per template
  }
  return files;
};

const failures = [];
const warnings = [];

for (const file of collectScanFiles(root)) {
  if (!(file.includes('.test.') || file.includes('__tests__'))) {
    const raw = readFileSync(file, 'utf8');
    const rel = relative(root, file);
    const text = file.endsWith('.json') ? raw : stripSourceComments(raw);
    if (text.includes('—')) {
      failures.push(`Em dash in buyer copy: ${rel}`);
    }
    if (file.endsWith('en.json')) {
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = null;
      }
      if (parsed && typeof parsed === 'object') {
        for (const [key, value] of Object.entries(parsed)) {
          const shouldScanValue =
            typeof value === 'string' && !key.endsWith('.tooltip') && !key.endsWith('.techLabel');
          if (shouldScanValue) {
            for (const banned of BANNED_IN_COPY) {
              if (value.includes(banned)) {
                failures.push(`Banned provider name "${banned}" in ${rel} (${key})`);
              }
            }
          }
        }
      }
    }
  }
}

const todoFiles = walk(root).filter(
  (f) => f.endsWith('.md') || f.endsWith('.ts') || f.endsWith('.tsx'),
);
let todoCount = 0;
for (const file of todoFiles) {
  if (!file.includes('node_modules')) {
    const text = readFileSync(file, 'utf8');
    const matches = text.match(/TODO\(vybekiit\)/g);
    if (matches !== null) {
      todoCount += matches.length;
    }
  }
}
warnings.push(`TODO(vybekiit) markers: ${todoCount}`);

if (failures.length > 0) {
  writeErrorLine(`Agent pattern check failed:\n${failures.map((f) => `  - ${f}`).join('\n')}`);
}
for (const w of warnings) {
  writeErrorLine(w);
}

if (strict && todoCount > 0) {
  process.exit(1);
}
process.exit(failures.length > 0 ? 1 : 0);
