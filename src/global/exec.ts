import type { SpawnOptions } from 'node:child_process';
import crossSpawn from 'cross-spawn';

/** Result of a single external-command invocation (never throws; a missing binary is code 127). */
export type ExecResult = {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
};

/** Runs a CLI binary with args and resolves its exit code + captured output. */
export type ExecFn = (args: readonly string[]) => Promise<ExecResult>;

export const MISSING_COMMAND_CODE = 127;

const missingCommand = (spawnFailure: Error): boolean =>
  'code' in spawnFailure && spawnFailure.code === 'ENOENT';

export const runProcess = (
  command: string,
  commandArguments: readonly string[],
  spawnSettings: SpawnOptions = {},
): Promise<ExecResult> =>
  new Promise((resolve) => {
    const child = crossSpawn(command, [...commandArguments], {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      ...spawnSettings,
    });
    const stdoutChunks: string[] = [];
    const stderrChunks: string[] = [];
    child.stdout?.setEncoding('utf8');
    child.stderr?.setEncoding('utf8');
    child.stdout?.on('data', (chunk: string) => stdoutChunks.push(chunk));
    child.stderr?.on('data', (chunk: string) => stderrChunks.push(chunk));
    child.on('error', (spawnFailure) => {
      const notFound = missingCommand(spawnFailure);
      resolve({
        code: notFound ? MISSING_COMMAND_CODE : 1,
        stdout: '',
        stderr: notFound ? `${command} not found` : spawnFailure.message,
      });
    });
    child.on('close', (exitCode) => {
      resolve({
        code: exitCode === null ? 1 : exitCode,
        stdout: stdoutChunks.join(''),
        stderr: stderrChunks.join(''),
      });
    });
  });

export const commandSucceeds = (command: string, commandArguments: readonly string[]): boolean =>
  crossSpawn.sync(command, [...commandArguments], { stdio: 'ignore', windowsHide: true }).status ===
  0;

/**
 * Build an {@link ExecFn} bound to one binary. A missing binary resolves to code 127
 * (POSIX "command not found") instead of throwing, so callers branch on "not installed"
 * the same way they branch on any other non-zero exit.
 *
 * @param bin - Executable resolved on PATH (e.g. 'claude', 'gh').
 * @returns An executor that never rejects.
 * @example
 * const gh = makeExec('gh');
 * const { code } = await gh(['api', 'user']); // 0 when signed in
 */
export const makeExec =
  (bin: string): ExecFn =>
  (args) =>
    runProcess(bin, args);
