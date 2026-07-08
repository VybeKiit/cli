import { execSync, spawn } from 'node:child_process';
import { request } from 'node:http';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import type { VerbLogger } from '@vybekiit/browser-automation/core/verbLogger';

const MAC_CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

export type EnsureChromeOptions = {
  readonly port: number;
  readonly profileDir: string;
  /** Kill Chrome on this port before launching (env FORCE_RELAUNCH=1). */
  readonly forceRelaunch?: boolean;
  readonly log?: Pick<VerbLogger, 'error' | 'log' | 'warn'>;
};

// trailing slashes: "/tmp/chrome///" -> "/tmp/chrome"
const TRAILING_SLASHES_PATTERN = /\/+$/;
// user-data-dir arg: "--user-data-dir=/tmp/chrome" -> "/tmp/chrome"
const USER_DATA_DIR_ARG_PATTERN = /--user-data-dir=(\S+)/;
// regexp metacharacters: "a.b" -> "a\\.b"
const REGEXP_SPECIAL_CHARS_PATTERN = /[.*+?^${}()|[\]\\]/g;

/**
 * Expand and normalize a Chrome profile directory path.
 *
 * @param dir - Profile directory, optionally starting with `~`.
 * @returns Absolute profile directory without trailing slashes.
 * @example
 * const profile = normalizeProfilePath('~/.vybekiit-chrome/');
 */
const normalizeProfilePath = (dir: string): string => {
  const expanded = dir.startsWith('~') ? resolve(homedir(), dir.slice(1)) : resolve(dir);
  return expanded.replace(TRAILING_SLASHES_PATTERN, '');
};

/**
 * Probe whether Chrome DevTools Protocol is reachable on a port.
 *
 * @param port - Local CDP port to probe.
 * @returns True when `/json/version` responds with HTTP 200.
 * @example
 * const ready = await isCdpReachable(9222);
 */
export const isCdpReachable = async (port: number): Promise<boolean> =>
  new Promise((resolveProbe) => {
    const req = request(
      { hostname: '127.0.0.1', method: 'GET', path: '/json/version', port, timeout: 1500 },
      (res) => {
        resolveProbe(res.statusCode === 200);
        res.resume();
      },
    );
    req.on('error', () => resolveProbe(false));
    req.on('timeout', () => {
      req.destroy();
      resolveProbe(false);
    });
    req.end();
  });

/**
 * Read `--user-data-dir` from the main Chrome process bound to a CDP port.
 *
 * @param port - Remote debugging port to inspect.
 * @returns The normalized Chrome profile directory, or null when it cannot be found.
 * @example
 * const profile = getChromeUserDataDirForPort(9222);
 */
export const getChromeUserDataDirForPort = (port: number): string | null => {
  try {
    const out = execSync('ps aux', { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
    const mainLine = out
      .split('\n')
      .find(
        (line) =>
          line.includes('/MacOS/Google Chrome ') &&
          line.includes(`--remote-debugging-port=${port}`) &&
          line.includes('--user-data-dir='),
      );
    if (mainLine === undefined) {
      return null;
    }
    const match = mainLine.match(USER_DATA_DIR_ARG_PATTERN);
    if (match === null || match[1] === undefined) {
      return null;
    }
    return normalizeProfilePath(match[1]);
  } catch {
    return null;
  }
};

/**
 * Wait until CDP is reachable or throw after the timeout.
 *
 * @param port - Local CDP port to probe.
 * @param maxMs - Maximum wait time in milliseconds.
 * @returns A promise that resolves when CDP becomes reachable.
 * @example
 * await waitForCdp(9222, 30000);
 */
const waitForCdp = async (port: number, maxMs: number): Promise<void> => {
  const start = Date.now();
  // biome-ignore lint/performance/noAwaitInLoops: CDP readiness is an intentional polling loop.
  while (!(await isCdpReachable(port))) {
    if (Date.now() - start > maxMs) {
      throw new Error(`Chrome CDP did not become ready on :${port} within ${maxMs}ms`);
    }
    await delay(500);
  }
};

/**
 * Stop the Chrome process that owns a specific CDP port and profile.
 *
 * @param port - Local CDP port to stop.
 * @param profileDir - Profile directory expected on that Chrome process.
 * @returns A promise that resolves after `pkill` exits or fails.
 * @example
 * await stopChromeOnPort(9222, '/tmp/chrome');
 */
const stopChromeOnPort = (port: number, profileDir: string): Promise<void> => {
  const normalized = normalizeProfilePath(profileDir);
  const escapedProfile = normalized.replace(REGEXP_SPECIAL_CHARS_PATTERN, '\\$&');
  const pattern = `--remote-debugging-port=${port}.*--user-data-dir=${escapedProfile}`;
  return new Promise((resolveStop) => {
    const child = spawn('pkill', ['-f', pattern], { stdio: 'ignore' });
    child.on('error', () => resolveStop());
    child.on('close', () => resolveStop());
  });
};

/**
 * Launch a detached Chrome process with remote debugging enabled.
 *
 * @param port - Local CDP port to expose.
 * @param profileDir - Profile directory to isolate from the user's daily browser.
 * @returns Nothing; the detached Chrome process continues independently.
 * @example
 * spawnChromeDetached(9222, '/tmp/chrome');
 */
const spawnChromeDetached = (port: number, profileDir: string): void => {
  const normalized = normalizeProfilePath(profileDir);
  if (process.platform === 'darwin') {
    const child = spawn(
      MAC_CHROME_PATH,
      [
        `--remote-debugging-port=${port}`,
        '--remote-allow-origins=*',
        '--no-first-run',
        '--no-default-browser-check',
        `--user-data-dir=${normalized}`,
      ],
      { detached: true, stdio: 'ignore' },
    );
    child.unref();
    return;
  }

  const child = spawn(
    'google-chrome',
    [
      `--remote-debugging-port=${port}`,
      '--remote-allow-origins=*',
      '--no-first-run',
      '--no-default-browser-check',
      `--user-data-dir=${normalized}`,
    ],
    { detached: true, stdio: 'ignore' },
  );
  child.unref();
};

/**
 * Ensure a dedicated Chrome instance is listening on `port` with the given profile.
 *
 * Playwright `connectOverCDP` only attaches - it does not launch Chrome or choose a profile.
 * Chrome 136+ also requires a non-default `--user-data-dir` when using remote debugging.
 * @see https://playwright.dev/docs/api/class-browsertype#browser-type-connect-over-cdp
 * @see https://developer.chrome.com/blog/remote-debugging-port
 * @param options - Port, profile, relaunch, and logger settings.
 * @returns A promise that resolves once Chrome CDP is ready.
 * @example
 * await ensureChromeWithCdp({ port: 9222, profileDir: '/tmp/chrome' });
 */
export const ensureChromeWithCdp = async (options: EnsureChromeOptions): Promise<void> => {
  const { port, profileDir } = options;
  const log = options.log === undefined ? console : options.log;
  const expectedProfile = normalizeProfilePath(profileDir);

  if (options.forceRelaunch) {
    log.log(
      `[chrome] FORCE_RELAUNCH - stopping Chrome on :${port} (profile preserved at ${expectedProfile})`,
    );
    await stopChromeOnPort(port, expectedProfile);
    await delay(1500);
  }

  if (await isCdpReachable(port)) {
    const actualProfile = getChromeUserDataDirForPort(port);
    if (actualProfile && actualProfile !== expectedProfile) {
      log.warn(
        `[chrome] :${port} is running with profile ${actualProfile}, expected ${expectedProfile}. ` +
          'Restarting dedicated Chrome (your profile data is preserved).',
      );
      await stopChromeOnPort(port, actualProfile);
      await delay(1500);
    } else if (actualProfile === expectedProfile) {
      log.log(
        `[chrome] Reusing dedicated Chrome on :${port}\n` +
          `       profile: ${expectedProfile}\n` +
          '       Sign in in THIS window - not your regular Chrome.',
      );
      return;
    } else {
      log.warn(
        `[chrome] :${port} is reachable but profile could not be verified - restarting with ${expectedProfile}`,
      );
      await stopChromeOnPort(port, expectedProfile);
      await delay(1500);
    }
  }

  log.log(`[chrome] Launching dedicated Chrome on :${port} (profile: ${expectedProfile})...`);
  spawnChromeDetached(port, expectedProfile);
  await waitForCdp(port, 30_000);
  log.log(
    `[chrome] Ready on http://127.0.0.1:${port}\n` +
      `       profile: ${expectedProfile}\n` +
      '       Sign in in THIS window - not your regular Chrome.',
  );
};
