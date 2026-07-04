#!/usr/bin/env node
/**
 * safetyScan.mjs — monorepo runner for the readable safety scan (ADR-0030).
 *
 * Loops the templates and runs each one's self-contained scripts/safety-scan.mjs against itself.
 * Backs the go-live gate silently: if a template ever starts shipping a preventable leak, this
 * goes red. Template scripts stay self-contained (ADR-0029); this only orchestrates them.
 *
 * Usage: node scripts/dev/checks/safetyScan.mjs
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const templates = ['web', 'mobile', 'spa', 'extension', 'backend'];
let failed = false;

for (const template of templates) {
  const templateDir = join(repoRoot, 'templates', template);
  const script = join(templateDir, 'scripts', 'safety-scan.mjs');
  if (!existsSync(script)) continue;
  process.stdout.write(`\n=== safety scan: ${template} ===\n`);
  try {
    execFileSync('node', [script], { cwd: templateDir, stdio: 'inherit' });
  } catch {
    failed = true; // the scanner exits non-zero when a critical is unresolved
  }
}

if (failed) {
  console.error('\nSafety scan found unresolved critical issues in at least one template.');
  process.exit(1);
}
console.log('\nAll template safety scans passed.');
