import type { SpawnOptions } from 'node:child_process';
import { appendFileSync, closeSync, mkdirSync, openSync, writeSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { type ExecResult, runProcess } from '../global/exec';

export const setupLogPath = (home: string = homedir()): string =>
  join(home, '.vybekiit', 'logs', 'setup.log');

const logHeading = (heading: string): string => `\n[${new Date().toISOString()}] ${heading}\n`;

export const appendSetupLog = (heading: string): void => {
  const logPath = setupLogPath();
  mkdirSync(dirname(logPath), { recursive: true });
  appendFileSync(logPath, logHeading(heading));
};

export const runLoggedProcess = async (
  command: string,
  commandArguments: readonly string[],
  spawnSettings: SpawnOptions = {},
): Promise<ExecResult> => {
  const logPath = setupLogPath();
  mkdirSync(dirname(logPath), { recursive: true });
  const logFile = openSync(logPath, 'a');
  try {
    writeSync(logFile, logHeading(`${command} ${commandArguments.join(' ')}`));
    return await runProcess(command, commandArguments, {
      ...spawnSettings,
      stdio: ['ignore', logFile, logFile],
    });
  } finally {
    closeSync(logFile);
  }
};
