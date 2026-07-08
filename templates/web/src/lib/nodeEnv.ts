/** Ambient Node process shape — accessed via globalThis to avoid `node:process` imports. */
interface NodeProcess {
  env?: Record<string, string | undefined>;
  cwd?: () => string;
}

const nodeProcess = (): NodeProcess | undefined =>
  (globalThis as { process?: NodeProcess }).process;

/**
 * Read Node environment variables without importing `node:process`.
 *
 * @returns The server process environment, or an empty object outside Node.
 * @example
 * const env = readNodeEnv();
 */
const readNodeEnv = (): Record<string, string | undefined> => {
  const process = nodeProcess();
  return process === undefined || process.env === undefined ? {} : process.env;
};

/**
 * Read the current Node working directory without importing `node:process`.
 *
 * @returns The current working directory, or `.` outside Node.
 * @example
 * const root = readNodeCwd();
 */
const readNodeCwd = (): string => {
  const process = nodeProcess();
  return process === undefined || process.cwd === undefined ? '.' : process.cwd();
};

export { readNodeCwd, readNodeEnv };
