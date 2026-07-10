#!/usr/bin/env node
/**
 * VybeKiit dev launcher for the mobile (Expo) template — the uniform `pnpm dev`
 * entry so you (or an agent) never have to memorize Expo's flags. Run
 * `pnpm dev --help` to list every mode and the exact command it runs.
 *
 * Self-contained on purpose: it keeps working after the template is scaffolded
 * into a buyer's repo, with no dependency on the monorepo.
 *
 * Why `--ios` / `--android` run `expo run:*` (a native dev build) and NOT
 * `expo start --ios` (Expo Go): this app links native modules
 * (react-native-mmkv, expo-sqlite) that Expo Go cannot load, so Expo Go would
 * redbox at startup. A dev build compiles those in and actually runs on the
 * simulator/emulator.
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import process from 'node:process';

const TEMPLATE = 'mobile (Expo)';

/** Ordered modes. `flag` selects the mode; `script` is the package.json script it runs. */
const MODES = [
  {
    flag: '--ios',
    script: 'ios',
    desc: 'Build + run a native dev build on an iOS simulator (expo run:ios)',
  },
  {
    flag: '--android',
    script: 'android',
    desc: 'Build + run a native dev build on an Android emulator (expo run:android)',
  },
  {
    flag: '--go',
    script: 'start',
    desc: 'Start Metro for Expo Go — NOTE: native modules (MMKV, SQLite) do not load in Expo Go',
  },
];

/** Runs when no mode flag is passed — keeps a bare `pnpm dev` a plain, persistent Metro. */
const DEFAULT_SCRIPT = 'start';

main();

/**
 * Parse argv, resolve the mode, and hand off to the matching pnpm script.
 * @returns {Promise<void>}
 */
async function main() {
  const argv = process.argv.slice(2);

  if (argv.includes('-h') || argv.includes('--help')) {
    printHelp();
    process.exit(0);
  }

  const mode = MODES.find((entry) => argv.includes(entry.flag));
  const script = mode === undefined ? DEFAULT_SCRIPT : mode.script;
  const passthrough = argv.filter(
    (arg) => arg !== '--' && !MODES.some((entry) => entry.flag === arg),
  );

  // Metro needs a port; auto-pick a free one so a busy 8081 never hangs the CLI.
  if (!passthrough.some((arg) => arg === '--port' || arg === '-p')) {
    passthrough.push('--port', String(await freePort(8081)));
  }

  const label = mode === undefined ? `running \`${DEFAULT_SCRIPT}\`` : mode.desc;
  process.stdout.write(`▸ ${TEMPLATE}: ${label}\n`);

  run(script, passthrough);
}

/**
 * Spawn `pnpm run <script> [-- ...extra]`, inheriting stdio and forwarding signals.
 * @param {string} script
 * @param {string[]} extra
 * @returns {void}
 */
function run(script, extra) {
  const args = ['run', script, ...(extra.length > 0 ? ['--', ...extra] : [])];
  const child = spawn('pnpm', args, { stdio: 'inherit', shell: process.platform === 'win32' });
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
      if (!child.killed) {
        child.kill(signal);
      }
    });
  }
  child.on('exit', (code, signal) => {
    if (signal !== null) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
}

/**
 * Return the first free TCP port at or after `start` (falls back to `start`).
 * @param {number} start
 * @returns {Promise<number>}
 */
async function freePort(start) {
  for (let port = start; port < start + 64; port++) {
    // biome-ignore lint/performance/noAwaitInLoops: probe ports in order, stopping at the first free one
    if (await isFree(port)) {
      return port;
    }
  }
  return start;
}

/**
 * Resolve true when nothing is listening on `port`.
 * @param {number} port
 * @returns {Promise<boolean>}
 */
function isFree(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => server.close(() => resolve(true)));
    // No host → bind the dual-stack `::`, so a listener on any interface
    // (Metro often binds IPv6 `*:8081`) is detected, not just IPv4 localhost.
    server.listen(port);
  });
}

/**
 * Print the mode list and a couple of examples.
 * @returns {void}
 */
function printHelp() {
  const lines = [
    `${TEMPLATE} — dev launcher`,
    '',
    'Usage:',
    '  pnpm dev [mode] [extra args forwarded to the tool]',
    '',
    'Modes:',
  ];
  for (const mode of MODES) {
    lines.push(`  ${mode.flag.padEnd(11)} ${mode.desc}`);
  }
  lines.push(`  ${'(default)'.padEnd(11)} Runs \`${DEFAULT_SCRIPT}\``);
  lines.push('', 'Metro auto-selects a free port; override with `--port <n>`.');
  lines.push(
    '',
    'Examples:',
    '  pnpm dev --ios',
    '  pnpm dev --ios --device "iPhone 17 Pro"',
    '  pnpm dev --go',
  );
  process.stdout.write(`${lines.join('\n')}\n`);
}
