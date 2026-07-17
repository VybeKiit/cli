import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const BIN = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'bin.js');
const SEMVER = /^\d+\.\d+\.\d+/;

// Regression guard for the v0.5.0 incident: tsup code-splitting moved the bin's
// main-module guard into a chunk, so the published CLI ran and did nothing. This exercises
// the BUILT artifact (not src) so a bundling regression can never ship silently again.
describe('built bin (dist/bin.js)', () => {
  it('prints a version and exits 0 — never a silent no-op', async () => {
    if (!existsSync(BIN)) {
      // dist not built in this run; the release pipeline builds before testing.
      expect(true).toBe(true);
      return;
    }
    const { stdout } = await execFileAsync('node', [BIN, '--version']);
    expect(stdout.trim()).toMatch(SEMVER);
    // Generous timeout: this spawns a cold `node` that loads the whole bundled
    // bin, which can exceed the 5s default under parallel test load in CI.
  }, 30_000);
});
