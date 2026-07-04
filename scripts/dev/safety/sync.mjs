#!/usr/bin/env node
/**
 * sync.mjs — copy the shared safety files from this one source into every template.
 *
 * The catalog (what counts as a leak) and the scanner (how it looks) are IDENTICAL in every
 * template — this folder is their single source of truth. Only safety-profile.mjs differs per
 * stack, and this script never touches it. Buyers still receive plain, readable files in their
 * own project; they are just generated from one place instead of hand-maintained five times.
 *
 * Edit the files here, then:
 *   node scripts/dev/safety/sync.mjs           # write the copies into each template
 *   node scripts/dev/safety/sync.mjs --check    # verify the copies match; exit 1 on drift (CI gate)
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const SHARED = ['safety-catalog.mjs', 'safety-scan.mjs'];
const TEMPLATES = ['web', 'mobile', 'spa', 'extension', 'backend'];
const check = process.argv.includes('--check');

const sources = new Map(SHARED.map((file) => [file, readFileSync(join(here, file), 'utf8')]));

let drift = 0;
let wrote = 0;
for (const template of TEMPLATES) {
  const dest = join(repoRoot, 'templates', template, 'scripts');
  if (!existsSync(dest)) continue;
  for (const file of SHARED) {
    const source = sources.get(file);
    const target = join(dest, file);
    if (check) {
      const current = existsSync(target) ? readFileSync(target, 'utf8') : '';
      if (current !== source) {
        drift++;
        console.error(`drift: templates/${template}/scripts/${file} differs from the source`);
      }
    } else {
      writeFileSync(target, source);
      wrote++;
      console.log(`synced templates/${template}/scripts/${file}`);
    }
  }
}

if (check) {
  if (drift > 0) {
    console.error(
      `\n${drift} safety file(s) out of sync. Edit scripts/dev/safety/ and run: pnpm safety:sync`,
    );
    process.exit(1);
  }
  console.log('All template safety files match the source.');
} else {
  console.log(
    `\nSynced ${wrote} file(s) into ${TEMPLATES.length} templates. Each template still needs its own safety-profile.mjs.`,
  );
}
