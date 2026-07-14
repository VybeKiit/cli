#!/usr/bin/env node
/**
 * Run the named dev sync scripts (in this same directory) concurrently.
 *
 * The sync builders write disjoint outputs — brand assets, the component catalog, page
 * recipes, and the design-system index — and none reads another's output, so running them in
 * parallel cuts predev/build wall-time from the sum of their durations to the max. Script names
 * are passed as arguments so `predev` can run all four and `build` can run the three it needs.
 *
 * @example
 * node runSyncParallel.mjs syncBrandAssets.mjs buildComponentLibraryIndex.mjs
 */
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const scripts = process.argv.slice(2);

if (scripts.length === 0) {
  console.error('runSyncParallel: no sync scripts specified');
  process.exit(1);
}

/**
 * Spawn one sync script and resolve on a clean exit, reject otherwise.
 *
 * @param {string} script - The script file name, resolved against this directory.
 * @returns {Promise<void>} Resolves when the script exits 0.
 */
const run = (script) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [join(here, script)], { stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`${script} exited with code ${code}`)),
    );
  });

const results = await Promise.allSettled(scripts.map(run));
const failures = results.filter((result) => result.status === 'rejected');

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(failure.reason instanceof Error ? failure.reason.message : failure.reason);
  }
  process.exit(1);
}
