import { execSync, spawn } from 'node:child_process';
import { homedir } from 'node:os';

export {
  ensureChromeWithCdp,
  getChromeUserDataDirForPort,
  isCdpReachable,
} from '@vybekiit/browserAutomation/core/launchChrome';

export function profileDirFor(domain: 'extension' | 'ls'): string {
  return domain === 'extension'
    ? `${homedir()}/.cws-chrome-profile`
    : `${homedir()}/.ls-chrome-profile`;
}

export function stopChromeDetachedMac(port: number, profileDir: string): Promise<void> {
  const normalized = profileDir.replace(/\/+$/, '');
  const pattern = `--remote-debugging-port=${port}.*--user-data-dir=${normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`;
  return new Promise((resolveStop) => {
    const child = spawn('pkill', ['-f', pattern], { stdio: 'ignore' });
    child.on('error', () => resolveStop());
    child.on('close', () => resolveStop());
  });
}

/** @deprecated Use getChromeUserDataDirForPort */
export function chromeProfileForPort(port: number): string | null {
  try {
    const out = execSync('ps aux', { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
    const mainLine = out
      .split('\n')
      .find(
        (line) =>
          line.includes('/MacOS/Google Chrome ') &&
          line.includes(`--remote-debugging-port=${port}`),
      );
    const match = mainLine?.match(/--user-data-dir=(\S+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}
