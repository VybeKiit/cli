/** Ambient Node process shape — accessed via globalThis to avoid a `node:process` import. */
type NodeProcess = Readonly<{
  env?: Record<string, string | undefined>;
}>;

/**
 * Read the optional process object Expo may inject.
 *
 * @returns The ambient process object when available.
 * @example
 * const processLike = nodeProcess();
 */
const nodeProcess = (): NodeProcess | undefined =>
  (globalThis as { process?: NodeProcess }).process;

/**
 * Read process env via globalThis rather than importing `node:process`.
 *
 * @returns The ambient env map, or an empty map when React Native has no process object.
 * @example
 * const env = readNodeEnv();
 */
export const readNodeEnv = (): Record<string, string | undefined> => {
  const processLike = nodeProcess();
  if (processLike === undefined || processLike.env === undefined) {
    return {};
  }

  return processLike.env;
};
