import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));

/** Locate the vybekiit-dedup binary. Checks local tools/dedup build first, then PATH. */
function findBinary(): string | null {
  // Monorepo development: built binary in tools/dedup/target/release/
  const devBinary = resolve(HERE, '../../tools/dedup/target/release/vybekiit-dedup');
  if (existsSync(devBinary)) return devBinary;

  // Debug build fallback
  const debugBinary = resolve(HERE, '../../tools/dedup/target/debug/vybekiit-dedup');
  if (existsSync(debugBinary)) return debugBinary;

  // Buyer install: binary available on PATH (installed via optionalDependencies)
  return 'vybekiit-dedup';
}

/** Run the vybekiit dedup subcommand. Shells out to the Rust binary with the given args. */
export async function runDedup(args: string[]): Promise<{ exitCode: number; output: string }> {
  const binary = findBinary();
  if (!binary) {
    return {
      exitCode: 1,
      output: JSON.stringify({
        error:
          'vybekiit-dedup binary not found. Run `cargo build --release` in tools/dedup/ or install the prebuilt binary.',
      }),
    };
  }

  try {
    const { stdout, stderr } = await execFileAsync(binary, args, {
      cwd: process.cwd(),
      timeout: 30_000,
      maxBuffer: 10 * 1024 * 1024,
    });
    // Binary outputs JSON to stdout, human-readable to stderr
    if (stderr) process.stderr.write(stderr);
    return { exitCode: 0, output: stdout };
  } catch (error: unknown) {
    // execFile throws on non-zero exit — that's expected for "blocked" status
    if (error && typeof error === 'object' && 'stdout' in error) {
      const execError = error as { stdout: string; stderr: string; code: number | null };
      if (execError.stderr) process.stderr.write(execError.stderr);
      return { exitCode: execError.code ?? 1, output: execError.stdout || '' };
    }
    return {
      exitCode: 1,
      output: JSON.stringify({
        error: `Failed to run vybekiit-dedup: ${error instanceof Error ? error.message : String(error)}`,
      }),
    };
  }
}
