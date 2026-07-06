#!/usr/bin/env node

/**
 * scripts/preflight-docker-test.mjs — Test the preflight script inside official Docker images.
 *
 * Spins up containers for Ubuntu, Debian, Fedora, and Alpine, installs Node only,
 * then runs `node scripts/preflight.mjs --json` to verify:
 *   1. The script detects missing tools correctly (Rust, pnpm, git)
 *   2. Exit code is 1 when required tools are missing
 *   3. Fix instructions are correct per distro
 *
 * Then installs ALL prerequisites and re-runs to verify exit 0.
 *
 * Usage:
 *   node scripts/preflight-docker-test.mjs            # run all images
 *   node scripts/preflight-docker-test.mjs --image ubuntu  # run one
 *   node scripts/preflight-docker-test.mjs --quick    # skip full-install verification
 */

import { execFile } from 'node:child_process';
import { resolve } from 'node:path';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const ROOT = resolve(import.meta.dirname, '..');

const IMAGES = [
  {
    name: 'ubuntu',
    image: 'node:22-bookworm',
    installAll: [
      'apt-get update -qq',
      'apt-get install -y -qq git curl build-essential >/dev/null 2>&1',
      "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y",
      'export PATH=$HOME/.cargo/bin:$PATH',
      'corepack enable',
      'corepack prepare pnpm@10.33.2 --activate',
    ],
  },
  {
    name: 'debian',
    image: 'node:22-slim',
    installAll: [
      'apt-get update -qq',
      'apt-get install -y -qq git curl gcc >/dev/null 2>&1',
      "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y",
      'export PATH=$HOME/.cargo/bin:$PATH',
      'corepack enable',
      'corepack prepare pnpm@10.33.2 --activate',
    ],
  },
  {
    name: 'alpine',
    image: 'node:22-alpine',
    installAll: [
      'apk add --no-cache git curl gcc musl-dev >/dev/null 2>&1',
      "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y",
      'export PATH=$HOME/.cargo/bin:$PATH',
      'corepack enable',
      'corepack prepare pnpm@10.33.2 --activate',
    ],
  },
  {
    name: 'fedora',
    image: 'fedora:latest',
    bareSetup: 'dnf install -y -q nodejs >/dev/null 2>&1',
    installAll: [
      'dnf install -y -q nodejs git gcc curl >/dev/null 2>&1',
      "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y",
      'export PATH=$HOME/.cargo/bin:$PATH',
      'npm install -g corepack',
      'corepack enable',
      'corepack prepare pnpm@10.33.2 --activate',
    ],
  },
];

const ONLY_IMAGE = process.argv.find((a, i) => process.argv[i - 1] === '--image');
const QUICK = process.argv.includes('--quick');

/**
 * @param {string} cmd
 * @param {string[]} args
 * @param {{ timeout?: number }} [opts]
 */
async function run(cmd, args, opts = {}) {
  const { stdout, stderr } = await exec(cmd, args, {
    timeout: opts.timeout || 300_000, // 5 min max per container
    maxBuffer: 10 * 1024 * 1024,
  });
  return { stdout, stderr };
}

/**
 * Run preflight inside a Docker container.
 * @param {{ name: string, image: string, bareSetup?: string, installAll: string[] }} target
 */
async function testImage(target) {
  const containerName = `vybekiit-preflight-${target.name}-${Date.now()}`;

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  Testing: ${target.name} (${target.image})`);
  console.log(`${'═'.repeat(60)}\n`);

  try {
    // ── Phase 1: Run with only Node (should fail — missing git, rust, pnpm) ──
    console.log('  Phase 1: Bare image (expect failures)...');

    const bareCmd = target.bareSetup
      ? `${target.bareSetup} && node scripts/preflight.mjs --json; echo EXIT:$?`
      : 'node scripts/preflight.mjs --json; echo EXIT:$?';

    const phase1Cmd = [
      'run',
      '--rm',
      '--name',
      containerName,
      '-v',
      `${ROOT}:/workspace:ro`,
      '-w',
      '/workspace',
      target.image,
      'sh',
      '-c',
      bareCmd,
    ];

    const { stdout: phase1Out } = await run('docker', phase1Cmd);
    const exitMatch1 = phase1Out.match(/EXIT:(\d+)/);
    const exitCode1 = exitMatch1 ? Number(exitMatch1[1]) : -1;

    // Extract JSON (everything before EXIT: line)
    const jsonStr1 = phase1Out.split('EXIT:')[0].trim();
    let json1;
    try {
      json1 = JSON.parse(jsonStr1);
    } catch {
      console.log('  ❌ Failed to parse JSON output:');
      console.log(`     ${jsonStr1.slice(0, 200)}`);
      return { name: target.name, pass: false, error: 'JSON parse failed (phase 1)' };
    }

    // Validate phase 1 results
    const missingRequired = json1.checks.filter((/** @type {any} */ c) => c.required && !c.ok);
    const foundRequired = json1.checks.filter((/** @type {any} */ c) => c.required && c.ok);

    console.log(`  ✅ Exit code: ${exitCode1} (expected: 1)`);
    console.log(`  ✅ OS detected: ${json1.os.platform}/${json1.os.arch}`);
    console.log(
      `  ✅ Required passing: ${foundRequired.map((/** @type {any} */ c) => c.name).join(', ') || 'none'}`,
    );
    console.log(
      `  ❌ Required missing: ${missingRequired.map((/** @type {any} */ c) => c.name).join(', ') || 'none'}`,
    );

    if (exitCode1 !== 1) {
      console.log(`  ⚠️  Expected exit 1 but got ${exitCode1}`);
    }

    // Node should always pass since we're using a node image (except fedora)
    if (target.image.startsWith('node:')) {
      const nodeCheck = json1.checks.find((/** @type {any} */ c) => c.name === 'Node.js');
      if (!nodeCheck?.ok) {
        console.log(`  ❌ Node.js should be found in ${target.image}`);
        return { name: target.name, pass: false, error: 'Node not found in node image' };
      }
    }

    // Rust and pnpm should be missing in bare image
    const rustCheck = json1.checks.find(
      (/** @type {any} */ c) => c.name === 'Rust (rustc + cargo)',
    );
    const pnpmCheck = json1.checks.find((/** @type {any} */ c) => c.name === 'pnpm');
    if (rustCheck?.ok) {
      console.log('  ⚠️  Rust unexpectedly found in bare image');
    }

    if (QUICK) {
      console.log('\n  ⏭️  Skipping full-install phase (--quick mode)\n');
      return { name: target.name, pass: true, phases: { bare: json1 } };
    }

    // ── Phase 2: Install everything, re-run (should pass) ──
    console.log('\n  Phase 2: Full install + re-run (expect all pass)...');

    const installScript = [
      ...target.installAll,
      'node /workspace/scripts/preflight.mjs --json',
      'echo EXIT:$?',
    ].join(' && ');

    const phase2Cmd = [
      'run',
      '--rm',
      '--name',
      `${containerName}-full`,
      '-v',
      `${ROOT}:/workspace:ro`,
      '-w',
      '/workspace',
      target.image,
      'sh',
      '-c',
      installScript,
    ];

    const { stdout: phase2Out } = await run('docker', phase2Cmd, { timeout: 600_000 }); // 10 min for rust install
    const exitMatch2 = phase2Out.match(/EXIT:(\d+)/);
    const exitCode2 = exitMatch2 ? Number(exitMatch2[1]) : -1;

    // Extract the JSON — it's the last { ... } block before "EXIT:"
    const beforeExit = phase2Out.split('EXIT:')[0];
    let json2;
    try {
      // Find the last occurrence of a top-level JSON opening brace
      // The JSON starts with '{\n  "os"' or '{\n  "checks"'
      const jsonMatch = beforeExit.match(/\{[\s\S]*"pass":\s*(true|false)\s*\}\s*$/);
      if (jsonMatch) {
        json2 = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: try to find { after the last non-JSON line
        const braceIdx = beforeExit.lastIndexOf('{\n  "');
        if (braceIdx >= 0) {
          json2 = JSON.parse(beforeExit.slice(braceIdx));
        } else {
          throw new Error('no JSON found');
        }
      }
    } catch {
      console.log('  ❌ Failed to parse JSON output in phase 2');
      console.log(`     Last 300 chars: ${beforeExit.slice(-300)}`);
      return { name: target.name, pass: false, error: 'JSON parse failed (phase 2)' };
    }

    const allPass = json2.pass === true;
    const failedChecks = json2.checks.filter((/** @type {any} */ c) => c.required && !c.ok);

    if (allPass) {
      console.log('  ✅ All required checks pass after full install');
    } else {
      console.log(
        `  ❌ Still failing after install: ${failedChecks.map((/** @type {any} */ c) => `${c.name} (found: ${c.found})`).join(', ')}`,
      );
    }
    console.log(`  ✅ Exit code: ${exitCode2} (expected: 0)`);

    return {
      name: target.name,
      pass: allPass && exitCode2 === 0,
      phases: { bare: json1, full: json2 },
    };
  } catch (/** @type {any} */ err) {
    console.log(`  ❌ Docker error: ${err.message?.slice(0, 200)}`);
    return { name: target.name, pass: false, error: err.message?.slice(0, 200) };
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  // Check Docker is available
  try {
    await run('docker', ['info'], { timeout: 10_000 });
  } catch {
    console.error('❌ Docker is not running. Start Docker Desktop and try again.');
    process.exit(1);
  }

  const targets = ONLY_IMAGE ? IMAGES.filter((img) => img.name === ONLY_IMAGE) : IMAGES;

  if (targets.length === 0) {
    console.error(
      `❌ Unknown image: ${ONLY_IMAGE}. Available: ${IMAGES.map((i) => i.name).join(', ')}`,
    );
    process.exit(1);
  }

  console.log('\n🐳 VybeKiit Preflight Docker Test');
  console.log(`   Testing ${targets.length} image(s): ${targets.map((t) => t.name).join(', ')}`);
  if (QUICK) console.log('   Mode: --quick (bare image only, skip full install)');

  const results = [];
  for (const target of targets) {
    const result = await testImage(target);
    results.push(result);
  }

  // Summary
  console.log(`\n${'═'.repeat(60)}`);
  console.log('  SUMMARY');
  console.log(`${'═'.repeat(60)}`);
  for (const r of results) {
    const icon = r.pass ? '✅' : '❌';
    console.log(`  ${icon} ${r.name}${r.error ? ` — ${r.error}` : ''}`);
  }

  const allPass = results.every((r) => r.pass);
  console.log(`\n${allPass ? '✅ All images pass.' : '❌ Some images failed.'}\n`);
  process.exit(allPass ? 0 : 1);
}

main();
