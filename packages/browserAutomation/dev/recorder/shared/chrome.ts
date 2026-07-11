import { spawn } from 'node:child_process';
import { homedir } from 'node:os';

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
