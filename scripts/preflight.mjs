#!/usr/bin/env node

/**
 * scripts/preflight.mjs — Cross-platform prerequisite checker for VybeKiit monorepo.
 *
 * Runs before `pnpm install` to verify the machine has everything needed.
 * Works on macOS, Linux (Ubuntu/Debian/Fedora/Arch), and Windows.
 *
 * Exit 0 = all required checks pass (warnings are non-blocking).
 * Exit 1 = one or more required prerequisites missing.
 *
 * Usage:
 *   node scripts/preflight.mjs          # normal — errors + warnings
 *   node scripts/preflight.mjs --json   # machine-readable output
 *   node scripts/preflight.mjs --fix    # print install commands for missing tools
 */

import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { arch, platform } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const ROOT = resolve(import.meta.dirname, '..');
const IS_WIN = platform() === 'win32';
const IS_MAC = platform() === 'darwin';
const IS_LINUX = platform() === 'linux';

const JSON_MODE = process.argv.includes('--json');
const FIX_MODE = process.argv.includes('--fix');

// ─── Results collection ──────────────────────────────────────────────────────

/** @typedef {{ name: string, required: boolean, ok: boolean, found: string|null, expected: string, fix: string }} CheckResult */
/** @type {CheckResult[]} */
const results = [];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Run a command and return trimmed stdout, or null on failure.
 * @param {string} cmd
 * @param {string[]} args
 * @returns {Promise<string|null>}
 */
async function run(cmd, args) {
  try {
    const { stdout } = await exec(cmd, args, { timeout: 10_000 });
    return stdout.trim();
  } catch {
    return null;
  }
}

/**
 * Parse a semver-ish string into [major, minor, patch].
 * @param {string} raw — e.g. "v22.5.0" or "10.33.2"
 * @returns {[number, number, number]}
 */
function parseSemver(raw) {
  const match = raw.match(/(\d+)\.(\d+)\.(\d+)/);
  if (!match) return [0, 0, 0];
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/**
 * Check if actual >= expected (major only for >=N checks, full for exact).
 * @param {string} actual
 * @param {string} expected — e.g. ">=20" or "10.33.2"
 * @returns {boolean}
 */
function meetsMinimum(actual, expected) {
  const [aMajor, aMinor, aPatch] = parseSemver(actual);
  if (expected.startsWith('>=')) {
    const min = Number(expected.slice(2));
    return aMajor >= min;
  }
  const [eMajor, eMinor, ePatch] = parseSemver(expected);
  if (aMajor !== eMajor) return aMajor > eMajor;
  if (aMinor !== eMinor) return aMinor > eMinor;
  return aPatch >= ePatch;
}

/**
 * Detect the Linux distro family.
 * @returns {Promise<string>}
 */
async function linuxDistro() {
  const release = await run('cat', ['/etc/os-release']).catch(() => null);
  if (!release) return 'unknown';
  if (/ubuntu|debian|mint|pop/i.test(release)) return 'debian';
  if (/fedora|rhel|centos|rocky|alma/i.test(release)) return 'fedora';
  if (/arch|manjaro|endeavour/i.test(release)) return 'arch';
  return 'unknown';
}

// ─── Check definitions ───────────────────────────────────────────────────────

async function checkNode() {
  const version = await run('node', ['--version']);
  const expected = '>=20';
  const ok = version ? meetsMinimum(version, expected) : false;
  results.push({
    name: 'Node.js',
    required: true,
    ok,
    found: version,
    expected: `${expected} (.nvmrc recommends 22)`,
    fix: IS_MAC
      ? 'brew install node@22  OR  curl -fsSL https://fnm.vercel.app/install | bash && fnm install 22'
      : IS_WIN
        ? 'winget install OpenJS.NodeJS.LTS  OR  https://nodejs.org/en/download'
        : 'curl -fsSL https://fnm.vercel.app/install | bash && fnm install 22',
  });
}

async function checkPnpm() {
  const version = await run('pnpm', ['--version']);
  const expected = '>=10';
  const ok = version ? meetsMinimum(version, expected) : false;
  results.push({
    name: 'pnpm',
    required: true,
    ok,
    found: version,
    expected: `${expected} (pinned: 10.33.2 via corepack)`,
    fix: 'corepack enable && corepack prepare pnpm@10.33.2 --activate',
  });
}

async function checkGit() {
  const version = await run('git', ['--version']);
  // git version 2.x.y
  const ok = version !== null;
  results.push({
    name: 'git',
    required: true,
    ok,
    found: version,
    expected: 'any (>=2.30 recommended)',
    fix: IS_MAC
      ? 'xcode-select --install  OR  brew install git'
      : IS_WIN
        ? 'winget install Git.Git'
        : 'sudo apt-get install -y git  OR  sudo dnf install -y git',
  });
}

async function checkRust() {
  const rustcVersion = await run('rustc', ['--version']);
  const cargoVersion = await run('cargo', ['--version']);
  const ok = rustcVersion !== null && cargoVersion !== null;
  results.push({
    name: 'Rust (rustc + cargo)',
    required: true,
    ok,
    found: rustcVersion,
    expected: 'edition 2021+ (for tools/dedup)',
    fix: "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y",
  });
}

async function checkCorepack() {
  const version = await run('corepack', ['--version']);
  const ok = version !== null;
  results.push({
    name: 'corepack',
    required: false,
    ok,
    found: version,
    expected: 'ships with Node >=16 (enables pnpm via packageManager field)',
    fix: 'npm install -g corepack && corepack enable',
  });
}

async function checkGhCli() {
  const version = await run('gh', ['--version']);
  const ok = version !== null;
  results.push({
    name: 'GitHub CLI (gh)',
    required: false,
    ok,
    found: version ? version.split('\n')[0] : null,
    expected: 'any (for mirror sync + PR creation)',
    fix: IS_MAC
      ? 'brew install gh'
      : IS_WIN
        ? 'winget install GitHub.cli'
        : 'sudo apt-get install -y gh  OR  https://cli.github.com',
  });
}

async function checkDocker() {
  const version = await run('docker', ['--version']);
  const ok = version !== null;
  results.push({
    name: 'Docker',
    required: false,
    ok,
    found: version,
    expected: 'any (for verify:docker native-deps check)',
    fix: IS_MAC
      ? 'brew install --cask docker'
      : IS_WIN
        ? 'winget install Docker.DockerDesktop'
        : 'https://docs.docker.com/engine/install/',
  });
}

async function checkDedupBinary() {
  const debugBin = join(ROOT, 'tools/dedup/target/debug/vybekiit-dedup');
  const releaseBin = join(ROOT, 'tools/dedup/target/release/vybekiit-dedup');
  const binPath = IS_WIN ? `${releaseBin}.exe` : releaseBin;
  const debugPath = IS_WIN ? `${debugBin}.exe` : debugBin;
  const exists = existsSync(binPath) || existsSync(debugPath);
  results.push({
    name: 'vybekiit-dedup binary',
    required: false,
    ok: exists,
    found: exists ? (existsSync(binPath) ? 'release' : 'debug') : null,
    expected: 'built (pre-commit hook uses it)',
    fix: 'cd tools/dedup && cargo build --release',
  });
}

// ─── Run all checks ──────────────────────────────────────────────────────────

async function main() {
  await Promise.all([
    checkNode(),
    checkPnpm(),
    checkGit(),
    checkRust(),
    checkCorepack(),
    checkGhCli(),
    checkDocker(),
    checkDedupBinary(),
  ]);

  // Sort: required first, then by name
  results.sort((a, b) => {
    if (a.required !== b.required) return a.required ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  if (JSON_MODE) {
    const output = {
      os: { platform: platform(), arch: arch() },
      checks: results,
      pass: results.filter((r) => r.required).every((r) => r.ok),
    };
    process.stdout.write(JSON.stringify(output, null, 2) + '\n');
    process.exit(output.pass ? 0 : 1);
  }

  // Human-friendly output
  const cols = process.stdout.columns || 80;
  console.log('');
  console.log('┌' + '─'.repeat(cols - 2) + '┐');
  console.log('│' + ' VybeKiit Preflight Check '.padStart((cols + 24) / 2).padEnd(cols - 2) + '│');
  console.log(
    '│' + ` OS: ${platform()}/${arch()} `.padStart((cols + 10) / 2).padEnd(cols - 2) + '│',
  );
  console.log('└' + '─'.repeat(cols - 2) + '┘');
  console.log('');

  let hasRequiredFailure = false;
  let hasWarning = false;

  for (const r of results) {
    const icon = r.ok ? '✅' : r.required ? '❌' : '⚠️ ';
    const tag = r.required ? '[REQUIRED]' : '[optional]';
    const found = r.found ?? 'NOT FOUND';
    console.log(`  ${icon} ${tag} ${r.name}`);
    console.log(`     found: ${found}`);
    console.log(`     needs: ${r.expected}`);
    if (!r.ok) {
      if (FIX_MODE) {
        console.log(`     fix:   ${r.fix}`);
      }
      if (r.required) hasRequiredFailure = true;
      else hasWarning = true;
    }
    console.log('');
  }

  console.log('─'.repeat(cols));

  if (hasRequiredFailure) {
    console.log('❌ Preflight FAILED — install the missing required tools above, then re-run.');
    if (!FIX_MODE) {
      console.log('   Run with --fix to see install commands.');
    }
    console.log('');
    process.exit(1);
  }

  if (hasWarning) {
    console.log('✅ All required checks pass. Some optional tools are missing (see ⚠️  above).');
  } else {
    console.log('✅ All checks pass — ready to install.');
  }
  console.log('');
  process.exit(0);
}

main();
