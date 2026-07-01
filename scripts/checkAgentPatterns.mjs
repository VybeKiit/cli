#!/usr/bin/env node
/**
 * Mechanical agent-pattern checks for buyer templates.
 * Usage: node scripts/checkAgentPatterns.mjs [--root templates/web] [--strict]
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import process from 'node:process';

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

const args = process.argv.slice(2);
const rootIdx = args.indexOf('--root');
const root = rootIdx >= 0 ? args[rootIdx + 1] : process.cwd();
const strict = args.includes('--strict');

function walk(dir, acc = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return acc;
  }
  for (const name of entries) {
    const path = join(dir, name);
    if (name === 'node_modules' || name === '.next' || name === 'dist' || name === '.output') {
      continue;
    }
    const st = statSync(path);
    if (st.isDirectory()) {
      walk(path, acc);
    } else {
      acc.push(path);
    }
  }
  return acc;
}

function stripSourceComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

function collectScanFiles(templateRoot) {
  const files = [];
  const jsonPath = join(templateRoot, 'messages/en.json');
  try {
    if (statSync(jsonPath).isFile()) files.push(jsonPath);
  } catch {
    // optional per template
  }
  const appPath = join(templateRoot, 'app');
  try {
    if (statSync(appPath).isDirectory()) {
      files.push(...walk(appPath).filter((f) => f.endsWith('.tsx') || f.endsWith('.jsx')));
    }
  } catch {
    // optional per template
  }
  return files;
}

const failures = [];
const warnings = [];

for (const file of collectScanFiles(root)) {
  if (file.includes('.test.') || file.includes('__tests__')) continue;
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
        if (typeof value !== 'string' || key.endsWith('.tooltip') || key.endsWith('.techLabel'))
          continue;
        for (const banned of BANNED_IN_COPY) {
          if (value.includes(banned)) {
            failures.push(`Banned provider name "${banned}" in ${rel} (${key})`);
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
  if (file.includes('node_modules')) continue;
  const text = readFileSync(file, 'utf8');
  const matches = text.match(/TODO\(vybekiit\)/g);
  if (matches) todoCount += matches.length;
}
warnings.push(`TODO(vybekiit) markers: ${todoCount}`);

if (failures.length) {
  console.error('Agent pattern check failed:\n' + failures.map((f) => `  - ${f}`).join('\n'));
}
for (const w of warnings) {
  console.warn(w);
}

if (strict && todoCount > 0) {
  process.exit(1);
}
process.exit(failures.length ? 1 : 0);
