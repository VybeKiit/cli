import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * Locate the vybekiit-dedup binary.
 *
 * @returns Local development binary path when present, otherwise the PATH command name.
 * @example
 * const binary = findBinary();
 */
const findBinary = (): string => {
  // Monorepo development: built binary in tools/dedup/target/release/
  const devBinary = resolve(HERE, '../../tools/dedup/target/release/vybekiit-dedup');
  if (existsSync(devBinary)) {
    return devBinary;
  }

  // Debug build fallback
  const debugBinary = resolve(HERE, '../../tools/dedup/target/debug/vybekiit-dedup');
  if (existsSync(debugBinary)) {
    return debugBinary;
  }

  // Buyer install: binary available on PATH (installed via optionalDependencies)
  return 'vybekiit-dedup';
};

type ExecFileErrorLike = {
  readonly stdout?: unknown;
  readonly stderr?: unknown;
  readonly code?: unknown;
};

type DedupResult = {
  readonly exitCode: number;
  readonly output: string;
};

/**
 * Check whether a caught error has execFile output fields.
 *
 * @param error - Unknown error caught from `execFile`.
 * @returns Error object with optional stdout, stderr, and code fields, or undefined.
 * @example
 * const execError = readExecFileError(error);
 */
const readExecFileError = (error: unknown): ExecFileErrorLike | undefined => {
  if (typeof error !== 'object' || error === null) {
    return;
  }

  if (!('stdout' in error)) {
    return;
  }

  return error;
};

/**
 * Convert a caught dedup execution error into command output.
 *
 * @param error - Unknown error caught from the Rust binary execution.
 * @returns Process exit code plus stdout output.
 * @example
 * const result = formatDedupExecError(error);
 */
const formatDedupExecError = (error: unknown): DedupResult => {
  const execError = readExecFileError(error);

  if (execError !== undefined) {
    const stderr = typeof execError.stderr === 'string' ? execError.stderr : '';
    const stdout = typeof execError.stdout === 'string' ? execError.stdout : '';
    const exitCode = typeof execError.code === 'number' ? execError.code : 1;

    if (stderr !== '') {
      process.stderr.write(stderr);
    }

    return { exitCode, output: stdout };
  }

  return {
    exitCode: 1,
    output: JSON.stringify({
      error: `Failed to run vybekiit-dedup: ${error instanceof Error ? error.message : String(error)}`,
    }),
  };
};

/**
 * Execute the Rust dedup binary.
 *
 * @param binary - Binary path or PATH command name.
 * @param args - CLI arguments to pass through.
 * @returns Process exit code plus stdout output.
 * @example
 * const result = await runDedupBinary('vybekiit-dedup', ['--json']);
 */
const runDedupBinary = async (binary: string, args: string[]): Promise<DedupResult> => {
  try {
    const { stdout, stderr } = await execFileAsync(binary, args, {
      cwd: process.cwd(),
      timeout: 30_000,
      maxBuffer: 10 * 1024 * 1024,
    });
    // Binary outputs JSON to stdout, human-readable to stderr
    if (stderr !== '') {
      process.stderr.write(stderr);
    }
    return { exitCode: 0, output: stdout };
  } catch (error: unknown) {
    return formatDedupExecError(error);
  }
};

/**
 * Run the vybekiit dedup subcommand.
 *
 * @param args - CLI arguments to pass to the Rust dedup binary.
 * @returns Process exit code plus stdout output.
 * @example
 * const result = await runDedup(['--intent', 'payment webhook']);
 */
export const runDedup = async (args: string[]): Promise<DedupResult> =>
  runDedupBinary(findBinary(), args);
