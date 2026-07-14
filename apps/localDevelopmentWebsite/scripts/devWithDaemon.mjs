#!/usr/bin/env node
/**
 * Dev launcher for the Local Dev Console.
 *
 * Starts the agent daemon (ws://localhost:3006) and the Next dev server together
 * so the chat streams real agent output straight into the browser — no terminal
 * windows. Playwright runs `next dev` directly (see playwright.config.ts) with
 * its own mock daemon, so this launcher is only used by `pnpm dev` /
 * `vybekiit local-dev`.
 */
import { spawn } from 'node:child_process';
import process from 'node:process';

const port = process.env.PORT ?? '3005';
const isWindows = process.platform === 'win32';

/**
 * Start the streaming agent daemon (tsx runs the TypeScript entry directly).
 *
 * @returns The daemon child process.
 */
const startDaemon = () => {
  const daemon = spawn('pnpm', ['exec', 'tsx', 'daemon/server.ts'], {
    stdio: 'inherit',
    shell: isWindows,
  });
  daemon.on('error', (err) => {
    process.stderr.write(
      `[dev] agent daemon did not start (${err.message}); chat falls back to the terminal launcher\n`,
    );
  });
  return daemon;
};

/**
 * Start the Next.js dev server.
 *
 * @returns The Next child process.
 */
const startNext = () =>
  spawn('pnpm', ['exec', 'next', 'dev', '--port', port], { stdio: 'inherit', shell: isWindows });

const daemon = startDaemon();
const next = startNext();

/**
 * Terminate both children with a signal.
 *
 * @param {NodeJS.Signals} signal - Signal to send.
 * @returns {void}
 */
const shutdown = (signal) => {
  for (const child of [daemon, next]) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
};

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    shutdown(signal);
    process.exit(0);
  });
}

// Next is the primary process: when it exits, tear down the daemon and mirror
// its exit code. A daemon crash only downgrades to the terminal fallback.
next.on('exit', (code) => {
  if (!daemon.killed) {
    daemon.kill('SIGTERM');
  }
  process.exit(code ?? 0);
});
