import process from 'node:process';
import { caughtMessage } from '@vybekiit/core';
import { runCli } from './cliRunner';

// This file is the package's `bin` entry (package.json -> "bin": "dist/bin.js"),
// so it only ever runs as the process entrypoint. It invokes the CLI directly and
// deliberately has NO "run only if this is the main module" guard.
//
// A bin never needs that guard, and the previous one silently broke the CLI: it
// compared `resolve(process.argv[1])` against `fileURLToPath(import.meta.url)`, but
// once tsup code-split the bundle the guard lived in a chunk whose URL no longer
// equalled argv[1] (the bin), so it always returned early and the published CLI did
// nothing. The build now emits a single self-contained bin (tsup.config.ts ->
// `splitting: false`, one entry) and a release smoke test guards this path.
//
// Errors are surfaced to stderr rather than swallowed — the whole point of the fix
// is that this entrypoint must never fail invisibly again.
try {
  process.exit(await runCli(process.argv.slice(2)));
} catch (error) {
  process.stderr.write(`vybekiit: ${caughtMessage(error)}\n`);
  process.exit(1);
}
