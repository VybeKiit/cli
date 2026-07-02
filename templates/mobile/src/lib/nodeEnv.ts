/** Ambient Node process shape — accessed via globalThis to avoid a `node:process` import. */
interface NodeProcess {
  env?: Record<string, string | undefined>;
}

function nodeProcess(): NodeProcess | undefined {
  return (globalThis as { process?: NodeProcess }).process;
}

/**
 * Read process env via globalThis rather than importing `node:process`: React Native has no
 * `node:process` module, and this keeps the asset resolver free of a Node-only dependency.
 */
export function readNodeEnv(): Record<string, string | undefined> {
  return nodeProcess()?.env ?? {};
}
