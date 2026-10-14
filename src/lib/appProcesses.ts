import process from 'node:process';
import crossSpawn from 'cross-spawn';
import { npmUserInstallArguments } from '../doctor/toolFolders';
import { type ExecResult, runProcess } from '../global/exec';
import { runLoggedProcess } from './setupLog';

export type PnpmCommand = readonly [string, ...string[]];

const PNPM_PACKAGE = 'pnpm@10.33.2';

export const runAppCommand = (
  cwd: string,
  bin: string,
  args: readonly string[],
): Promise<ExecResult> => runLoggedProcess(bin, args, { cwd });

export const startDetachedCommand = (
  cwd: string,
  bin: string,
  args: readonly string[],
): boolean => {
  try {
    const child = crossSpawn(bin, [...args], {
      cwd,
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
      env: process.env,
    });
    child.unref();
    return true;
  } catch {
    return false;
  }
};

const pnpmWorks = async (pnpm: PnpmCommand): Promise<boolean> => {
  const [bin, ...prefix] = pnpm;
  const versionProbe = await runProcess(bin, [...prefix, '--version']);
  return versionProbe.code === 0;
};

const installPnpmForUser = async (): Promise<boolean> => {
  const pnpmInstallArguments = npmUserInstallArguments(PNPM_PACKAGE);
  const pnpmInstall = await runLoggedProcess('npm', pnpmInstallArguments);
  return pnpmInstall.code === 0;
};

export const findPnpmCommand = async (): Promise<PnpmCommand | null> => {
  const pnpm: PnpmCommand = ['pnpm'];
  if (await pnpmWorks(pnpm)) {
    return pnpm;
  }
  const userInstalled = await installPnpmForUser();
  if (userInstalled && (await pnpmWorks(pnpm))) {
    return pnpm;
  }
  const npxPnpm: PnpmCommand = ['npx', '-y', PNPM_PACKAGE];
  return (await pnpmWorks(npxPnpm)) ? npxPnpm : null;
};
