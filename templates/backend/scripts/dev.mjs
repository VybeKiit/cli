#!/usr/bin/env node
/**
 * VybeKiit dev launcher for the backend (Express) template — the uniform
 * `pnpm dev` entry. Run `pnpm dev --help` to see what it runs. Self-contained so
 * it keeps working after the template is scaffolded into a buyer's repo.
 */
import { spawn } from 'node:child_process';
import process from 'node:process';

const TEMPLATE = 'backend (Express)';

/** Ordered modes. `flag` selects the mode; `script` is the package.json script it runs. */
const MODES = [];

/** Runs when no mode flag is passed. */
const DEFAULT_SCRIPT = 'dev:server';

main();

/**
 * Parse argv, resolve the mode, and hand off to the matching pnpm script.
 * @returns {void}
 */
function main() {
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
 * Print the mode list and an example.
 * @returns {void}
 */
function printHelp() {
  const lines = [
    `${TEMPLATE} — dev launcher`,
    '',
    'Usage:',
    '  pnpm dev [mode] [extra args forwarded to the tool]',
    '',
  ];
  if (MODES.length > 0) {
    lines.push('Modes:');
    for (const mode of MODES) {
      lines.push(`  ${mode.flag.padEnd(11)} ${mode.desc}`);
    }
  }
  lines.push(`  ${'(default)'.padEnd(11)} Runs \`${DEFAULT_SCRIPT}\``);
  lines.push('', 'Examples:', '  pnpm dev');
  process.stdout.write(`${lines.join('\n')}\n`);
}
