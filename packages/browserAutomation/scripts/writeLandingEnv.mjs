#!/usr/bin/env node
/**
 * Merge ls setup --json env block into apps/landing/.env.local
 * Usage: node dist/cli/index.cjs ls setup --json ... | node scripts/writeLandingEnv.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const landingEnv = resolve(process.cwd(), '../../apps/landing/.env.local');

const raw = readFileSync(0, 'utf8');
const payload = JSON.parse(raw);
if (!(payload.ok && payload.env)) {
  console.error('Expected setup JSON with ok:true and env block');
  process.exit(1);
}

let env = '';
try {
  env = readFileSync(landingEnv, 'utf8');
} catch {
  env = '';
}

for (const [key, value] of Object.entries(payload.env)) {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, 'm');
  env = re.test(env) ? env.replace(re, line) : `${env.trimEnd()}\n${line}\n`;
}

writeFileSync(landingEnv, env.trimStart() + (env.endsWith('\n') ? '' : '\n'));
console.log(`Updated ${landingEnv}`);
