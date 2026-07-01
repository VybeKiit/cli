/** Ambient Node process shape — accessed via globalThis to avoid `node:process` imports. */
interface NodeProcess {
  env?: Record<string, string | undefined>;
  cwd?: () => string;
}

function nodeProcess(): NodeProcess | undefined {
  return (globalThis as { process?: NodeProcess }).process;
}

/** Server modules read env here; never import `node:process` (breaks Next client bundles). */
export function readNodeEnv(): Record<string, string | undefined> {
  return nodeProcess()?.env ?? {};
}

/** Project root for server-side asset resolution. */
export function readNodeCwd(): string {
  return nodeProcess()?.cwd?.() ?? '.';
}
