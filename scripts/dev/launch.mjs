#!/usr/bin/env node
/**
 * VybeKiit monorepo dev launcher — `pnpm dev`.
 *
 * Bare `pnpm dev` on a TTY shows a menu of every runnable app and starts the one
 * you pick. Non-interactively (agents/CI), `pnpm dev <app> [flags]` runs it
 * directly and `pnpm dev --help` lists everything. Each app just delegates to its
 * own package `dev` script (the per-template launcher), so run logic lives in one
 * place per app — this file only owns the app list and the picker.
 */
import { spawn } from 'node:child_process';
import process from 'node:process';
import { createInterface } from 'node:readline/promises';

/** Every runnable app. `filter` = pnpm workspace name (null = the turbo fan-out). */
const APPS = [
  { key: 'web', filter: 'my-vybekiit-app', hint: 'Next.js template dev server' },
  { key: 'mobile', filter: 'my-vybekiit-mobile', hint: 'Expo app — try `pnpm dev mobile --ios`' },
  { key: 'extension', filter: 'my-vybekiit-extension', hint: 'WXT browser extension' },
  { key: 'backend', filter: 'my-vybekiit-backend', hint: 'Express API' },
  { key: 'spa', filter: 'my-vybekiit-spa', hint: 'Vite admin SPA' },
  { key: 'landing', filter: 'vybekiit-landing', hint: 'The vybekiit.com store' },
  { key: 'ui', filter: 'vybekiit-component-library', hint: 'UI library browser (ui.vybekiit.com)' },
  { key: 'local', filter: 'vybekiit-local-development-website', hint: 'Local dev console' },
  {
    key: 'mobile-landing',
    filter: 'vybekiit-mobile-app-landing',
    hint: 'Mobile-app landing page (mobile-landing-page.vybekiit.com)',
  },
  {
    key: 'ext-landing',
    filter: 'vybekiit-extension-landing',
    hint: 'Extension landing page (extension-landing-page.vybekiit.com)',
  },
  { key: 'all', filter: null, hint: 'Every dev server at once (turbo run dev)' },
];

main();

/**
 * Resolve the target app (arg or menu) and run it.
 * @returns {Promise<void>}
 */
async function main() {
  const argv = process.argv.slice(2);
  const [first, ...rest] = argv;

  // A known app as the first token wins — forward the rest (including --help) to it.
  const named = APPS.find((entry) => entry.key === first);
  if (named !== undefined) {
    run(named, rest);
    return;
  }

  // No app given: interactive picker on a TTY, otherwise print help (never hang CI).
  if (first === undefined) {
    if (process.stdin.isTTY === true) {
      const picked = await pick();
      if (picked !== undefined) {
        run(picked, []);
      }
      return;
    }
    printHelp();
    process.exit(0);
  }

  // Explicit help, or an unknown app.
  if (first === '-h' || first === '--help') {
    printHelp();
    process.exit(0);
  }
  process.stderr.write(`Unknown app "${first}".\n\n`);
  printHelp();
  process.exit(1);
}

/**
 * Delegate to the app's own `dev` script (or turbo for `all`), forwarding signals.
 * @param {{ key: string, filter: string | null }} app
 * @param {string[]} extra
 * @returns {void}
 */
function run(app, extra) {
  const args =
    app.filter === null
      ? ['run', 'dev:all']
      : ['--filter', app.filter, 'dev', ...(extra.length > 0 ? ['--', ...extra] : [])];
  process.stdout.write(`▸ ${app.key}: pnpm ${args.join(' ')}\n`);
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
 * Interactive numbered picker (no external deps).
 * @returns {Promise<{ key: string, filter: string | null } | undefined>}
 */
async function pick() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    process.stdout.write('Which app do you want to run?\n\n');
    APPS.forEach((app, index) => {
      process.stdout.write(`  ${String(index + 1).padStart(2)}. ${app.key.padEnd(10)} ${app.hint}\n`);
    });
    const answer = (await rl.question('\nNumber (or app name): ')).trim();
    return APPS[Number(answer) - 1] ?? APPS.find((app) => app.key === answer);
  } finally {
    rl.close();
  }
}

/**
 * Print the app list and a few examples.
 * @returns {void}
 */
function printHelp() {
  const lines = [
    'VybeKiit dev launcher — pnpm dev',
    '',
    'Usage:',
    '  pnpm dev                 Pick an app from a menu (interactive)',
    '  pnpm dev <app> [flags]   Run one app directly',
    '  pnpm dev --help          Show this help',
    '',
    'Apps:',
  ];
  for (const app of APPS) {
    lines.push(`  ${app.key.padEnd(10)} ${app.hint}`);
  }
  lines.push(
    '',
    'Examples:',
    '  pnpm dev mobile --ios          Build + run mobile on an iOS simulator',
    '  pnpm dev mobile --android      Build + run mobile on an Android emulator',
    '  pnpm dev web                   Start the web template dev server',
    '',
    'Each app forwards flags to its own launcher (run `pnpm --filter <pkg> dev --help`).',
  );
  process.stdout.write(`${lines.join('\n')}\n`);
}
