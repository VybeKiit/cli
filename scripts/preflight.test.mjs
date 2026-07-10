/**
 * scripts/preflight.test.mjs — Tests for the preflight prerequisite checker.
 *
 * Runs via `pnpm test:scripts` (vitest --root scripts).
 * Tests the script as a subprocess so we validate exit codes, output format, and
 * the ability to detect missing tools by manipulating PATH.
 */

import { execFile } from 'node:child_process';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const exec = promisify(execFile);
const ROOT = resolve(import.meta.dirname, '..');
const SCRIPT = resolve(ROOT, 'scripts/preflight.mjs');

/**
 * Run the preflight script with given args and env overrides.
 * @param {string[]} args
 * @param {Record<string, string>} [envOverrides]
 * @returns {Promise<{stdout: string, stderr: string, code: number}>}
 */
async function runPreflight(args = [], envOverrides = {}) {
  try {
    const { stdout, stderr } = await exec('node', [SCRIPT, ...args], {
      cwd: ROOT,
      timeout: 15_000,
      env: { ...process.env, ...envOverrides },
    });
    return { stdout, stderr, code: 0 };
  } catch (/** @type {any} */ err) {
    return {
      stdout: err.stdout || '',
      stderr: err.stderr || '',
      code: err.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER' ? 2 : (err.status ?? 1),
    };
  }
}

// ─── JSON mode ───────────────────────────────────────────────────────────────

describe('preflight --json', () => {
  it('produces valid JSON output', async () => {
    const { stdout, code } = await runPreflight(['--json']);
    const json = JSON.parse(stdout);
    expect(json).toHaveProperty('os');
    expect(json).toHaveProperty('checks');
    expect(json).toHaveProperty('pass');
    expect(json.os).toHaveProperty('platform');
    expect(json.os).toHaveProperty('arch');
    expect(code).toBe(0);
  });

  it('includes all 8 checks', async () => {
    const { stdout } = await runPreflight(['--json']);
    const json = JSON.parse(stdout);
    expect(json.checks).toHaveLength(8);
  });

  it('reports 4 required checks', async () => {
    const { stdout } = await runPreflight(['--json']);
    const json = JSON.parse(stdout);
    const required = json.checks.filter((/** @type {any} */ c) => c.required);
    expect(required).toHaveLength(4);
    const names = required.map((/** @type {any} */ c) => c.name).sort();
    expect(names).toEqual(['Node.js', 'Rust (rustc + cargo)', 'git', 'pnpm'].sort());
  });

  it('reports 4 optional checks', async () => {
    const { stdout } = await runPreflight(['--json']);
    const json = JSON.parse(stdout);
    const optional = json.checks.filter((/** @type {any} */ c) => !c.required);
    expect(optional).toHaveLength(4);
  });

  it('each check has name, required, ok, found, expected, fix', async () => {
    const { stdout } = await runPreflight(['--json']);
    const json = JSON.parse(stdout);
    for (const check of json.checks) {
      expect(check).toHaveProperty('name');
      expect(check).toHaveProperty('required');
      expect(check).toHaveProperty('ok');
      expect(check).toHaveProperty('found');
      expect(check).toHaveProperty('expected');
      expect(check).toHaveProperty('fix');
    }
  });

  it('pass is true when all required checks pass', async () => {
    const { stdout } = await runPreflight(['--json']);
    const json = JSON.parse(stdout);
    // On this machine everything should pass
    expect(json.pass).toBe(true);
  });
});

// ─── Human mode ──────────────────────────────────────────────────────────────

describe('preflight (human mode)', () => {
  it('outputs a banner with OS info', async () => {
    const { stdout, code } = await runPreflight([]);
    expect(stdout).toContain('VybeKiit Preflight Check');
    expect(stdout).toMatch(/OS: (darwin|linux|win32)\//);
    expect(code).toBe(0);
  });

  it('shows ✅ for passing checks', async () => {
    const { stdout } = await runPreflight([]);
    expect(stdout).toContain('✅');
    expect(stdout).toContain('[REQUIRED]');
  });

  it('shows All checks pass when everything is fine', async () => {
    const { stdout } = await runPreflight([]);
    // Full pass, or required-only pass when optional tools (e.g. dedup binary) are missing on CI.
    expect(stdout).toMatch(/All (required )?checks pass/);
  });
});

// ─── --fix mode ──────────────────────────────────────────────────────────────

describe('preflight --fix', () => {
  it('runs without error on a healthy machine', async () => {
    const { code } = await runPreflight(['--fix']);
    expect(code).toBe(0);
  });
});

// ─── Failure simulation ──────────────────────────────────────────────────────

describe('preflight with broken PATH', () => {
  it('exits 1 when required tools are not on PATH', async () => {
    // Use an empty PATH so no tools are found (except node which runs the script)
    const nodeBin = resolve(process.execPath, '..');
    const { stdout, code } = await runPreflight(['--json'], {
      PATH: nodeBin, // Only node itself is available
    });
    expect(code).toBe(1);
    const json = JSON.parse(stdout);
    expect(json.pass).toBe(false);
    // git and rust should be missing
    const git = json.checks.find((/** @type {any} */ c) => c.name === 'git');
    const rust = json.checks.find((/** @type {any} */ c) => c.name === 'Rust (rustc + cargo)');
    expect(git.ok).toBe(false);
    expect(rust.ok).toBe(false);
  });

  it("still finds Node (since it's running the script)", async () => {
    const nodeBin = resolve(process.execPath, '..');
    const { stdout } = await runPreflight(['--json'], { PATH: nodeBin });
    const json = JSON.parse(stdout);
    const node = json.checks.find((/** @type {any} */ c) => c.name === 'Node.js');
    expect(node.ok).toBe(true);
  });

  it('includes fix instructions for missing tools', async () => {
    const nodeBin = resolve(process.execPath, '..');
    const { stdout } = await runPreflight(['--json'], { PATH: nodeBin });
    const json = JSON.parse(stdout);
    const git = json.checks.find((/** @type {any} */ c) => c.name === 'git');
    expect(git.fix).toBeTruthy();
    expect(git.fix.length).toBeGreaterThan(5);
  });
});

// ─── Version parsing logic (tested indirectly via real versions) ─────────────

describe('version detection', () => {
  it('detects Node version correctly', async () => {
    const { stdout } = await runPreflight(['--json']);
    const json = JSON.parse(stdout);
    const node = json.checks.find((/** @type {any} */ c) => c.name === 'Node.js');
    expect(node.ok).toBe(true);
    expect(node.found).toMatch(/^v\d+\.\d+\.\d+$/);
  });

  it('detects pnpm version correctly', async () => {
    const { stdout } = await runPreflight(['--json']);
    const json = JSON.parse(stdout);
    const pnpm = json.checks.find((/** @type {any} */ c) => c.name === 'pnpm');
    expect(pnpm.ok).toBe(true);
    expect(pnpm.found).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('detects Rust version correctly', async () => {
    const { stdout } = await runPreflight(['--json']);
    const json = JSON.parse(stdout);
    const rust = json.checks.find((/** @type {any} */ c) => c.name === 'Rust (rustc + cargo)');
    expect(rust.ok).toBe(true);
    expect(rust.found).toContain('rustc');
  });
});
