import { resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { runCli } from './cliRunner';

/**
 * Run the CLI only when this module is the process entrypoint.
 *
 * @returns Promise that resolves after process exit is requested.
 * @example
 * await runBinEntrypoint();
 */
export const runBinEntrypoint = async (): Promise<void> => {
  if (
    process.argv[1] === undefined ||
    resolve(process.argv[1]) !== fileURLToPath(import.meta.url)
  ) {
    return;
  }

  try {
    const code = await runCli(process.argv.slice(2));
    process.exit(code);
  } catch {
    process.exit(1);
  }
};

await runBinEntrypoint();
