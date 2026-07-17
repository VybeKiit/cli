import { execFile } from 'node:child_process';

/** Result of a single external-command invocation (never throws; a missing binary is code 127). */
export type ExecResult = {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
};

/** Runs a CLI binary with args and resolves its exit code + captured output. */
export type ExecFn = (args: readonly string[]) => Promise<ExecResult>;

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
    new Promise((resolve) => {
      execFile(bin, [...args], { encoding: 'utf8' }, (error, stdout, stderr) => {
        if (error && 'code' in error && error.code === 'ENOENT') {
          resolve({ code: 127, stdout: '', stderr: `${bin} not found` });
          return;
        }
        let code = 0;
        if (error) {
          code = typeof error.code === 'number' ? error.code : 1;
        }
        resolve({ code, stdout: stdout ?? '', stderr: stderr ?? '' });
      });
    });
