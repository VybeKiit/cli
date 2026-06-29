import { spawn } from 'node:child_process';
import { request } from 'node:http';
import { homedir } from 'node:os';
import { setTimeout as delay } from 'node:timers/promises';

const MAC_CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

export async function isCdpReachable(port: number): Promise<boolean> {
  return new Promise((resolveProbe) => {
    const req = request(
      { hostname: 'localhost', method: 'GET', path: '/json/version', port, timeout: 1500 },
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

async function waitForCdp(port: number, maxMs: number): Promise<void> {
  const start = Date.now();
  while (!(await isCdpReachable(port))) {
    if (Date.now() - start > maxMs)
      throw new Error(`CDP did not come up on :${port} within ${maxMs}ms.`);
    await delay(500);
  }
}

function spawnChromeDetachedMac(port: number, profileDir: string): void {
  const child = spawn(
    MAC_CHROME_PATH,
    [
      `--remote-debugging-port=${port}`,
      '--remote-allow-origins=*',
      '--no-first-run',
      '--no-default-browser-check',
      `--user-data-dir=${profileDir}`,
    ],
    { detached: true, stdio: 'ignore' },
  );
  child.unref();
}

function stopChromeDetachedMac(port: number, profileDir: string): Promise<void> {
  const pattern = `--remote-debugging-port=${port}.*--user-data-dir=${profileDir}`;
  return new Promise((resolveStop) => {
    const child = spawn('pkill', ['-f', pattern], { stdio: 'ignore' });
    child.on('error', () => resolveStop());
    child.on('close', () => resolveStop());
  });
}

/** Ensure Chrome with CDP is running for the given profile directory. */
export async function ensureChromeWithCdp(port: number, profileDir: string): Promise<void> {
  if (await isCdpReachable(port)) {
    console.log(
      [
        `Chrome is already listening on http://localhost:${port}. Ready.`,
        `Expected profile: ${profileDir}`,
        'Use that Chrome window (not your regular browser) when picking locators in the Inspector.',
      ].join('\n'),
    );
    return;
  }

  if (process.platform !== 'darwin') {
    console.log(
      `Auto-spawn is mac-only today. Run:\n\n  google-chrome --remote-debugging-port=${port} --user-data-dir="${profileDir}"\n`,
    );
    process.exitCode = 1;
    return;
  }

  console.log(`Launching dedicated Chrome (profile: ${profileDir}) on :${port}…`);
  spawnChromeDetachedMac(port, profileDir);
  await waitForCdp(port, 30_000);
  console.log(
    `Chrome is ready on http://localhost:${port}. Sign in once if this is a fresh profile.`,
  );
}

export function profileDirFor(domain: 'extension' | 'ls'): string {
  return domain === 'extension'
    ? `${homedir()}/.cws-chrome-profile`
    : `${homedir()}/.ls-chrome-profile`;
}

export { stopChromeDetachedMac };
