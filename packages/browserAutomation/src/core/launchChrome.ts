import { execSync, spawn } from 'node:child_process';
import { request } from 'node:http';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const MAC_CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

export type EnsureChromeOptions = {
  port: number;
  profileDir: string;
  /** Kill Chrome on this port before launching (env FORCE_RELAUNCH=1). */
  forceRelaunch?: boolean;
  log?: Pick<Console, 'error' | 'log' | 'warn'>;
};

function normalizeProfilePath(dir: string): string {
  const expanded = dir.startsWith('~') ? resolve(homedir(), dir.slice(1)) : resolve(dir);
  return expanded.replace(/\/+$/, '');
}

export async function isCdpReachable(port: number): Promise<boolean> {
  return new Promise((resolveProbe) => {
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
}

/** Read `--user-data-dir` from the main Chrome process bound to a CDP port. */
export function getChromeUserDataDirForPort(port: number): string | null {
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
    if (!mainLine) return null;
    const match = mainLine.match(/--user-data-dir=(\S+)/);
    return match?.[1] ? normalizeProfilePath(match[1]) : null;
  } catch {
    return null;
  }
}

async function waitForCdp(port: number, maxMs: number): Promise<void> {
  const start = Date.now();
  while (!(await isCdpReachable(port))) {
    if (Date.now() - start > maxMs) {
      throw new Error(`Chrome CDP did not become ready on :${port} within ${maxMs}ms`);
    }
    await delay(500);
  }
}

function stopChromeOnPort(port: number, profileDir: string): Promise<void> {
  const normalized = normalizeProfilePath(profileDir);
  const pattern = `--remote-debugging-port=${port}.*--user-data-dir=${normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`;
  return new Promise((resolveStop) => {
    const child = spawn('pkill', ['-f', pattern], { stdio: 'ignore' });
    child.on('error', () => resolveStop());
    child.on('close', () => resolveStop());
  });
}

function spawnChromeDetached(port: number, profileDir: string): void {
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
}

/**
 * Ensure a dedicated Chrome instance is listening on `port` with the given profile.
 *
 * Playwright `connectOverCDP` only attaches — it does not launch Chrome or choose a profile.
 * Chrome 136+ also requires a non-default `--user-data-dir` when using remote debugging.
 * @see https://playwright.dev/docs/api/class-browsertype#browser-type-connect-over-cdp
 * @see https://developer.chrome.com/blog/remote-debugging-port
 */
export async function ensureChromeWithCdp(options: EnsureChromeOptions): Promise<void> {
  const log = options.log ?? console;
  const port = options.port;
  const expectedProfile = normalizeProfilePath(options.profileDir);

  if (options.forceRelaunch) {
    log.log(
      `[chrome] FORCE_RELAUNCH — stopping Chrome on :${port} (profile preserved at ${expectedProfile})`,
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
          '       Sign in in THIS window — not your regular Chrome.',
      );
      return;
    } else {
      log.warn(
        `[chrome] :${port} is reachable but profile could not be verified — restarting with ${expectedProfile}`,
      );
      await stopChromeOnPort(port, expectedProfile);
      await delay(1500);
    }
  }

  log.log(`[chrome] Launching dedicated Chrome on :${port} (profile: ${expectedProfile})…`);
  spawnChromeDetached(port, expectedProfile);
  await waitForCdp(port, 30_000);
  log.log(
    `[chrome] Ready on http://127.0.0.1:${port}\n` +
      `       profile: ${expectedProfile}\n` +
      '       Sign in in THIS window — not your regular Chrome.',
  );
}
