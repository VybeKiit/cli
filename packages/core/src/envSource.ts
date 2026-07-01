/** A readable view of `process.env` without requiring `@types/node` in consumers. */
export type EnvSource = Record<string, string | undefined>;

/**
 * Resolve a provider adapter from a parsed provider key.
 * Keeps per-package factories while centralizing switch shape (ADR-0002).
 */
export function resolveEnvProvider<P>(
  providerKey: string,
  adapters: Readonly<Record<string, (env: EnvSource) => P>>,
  env: EnvSource,
  defaultKey: string,
): P {
  const factory = adapters[providerKey] ?? adapters[defaultKey];
  if (!factory) {
    throw new Error(`No adapter registered for provider "${providerKey}"`);
  }
  return factory(env);
}

/**
 * Like {@link resolveEnvProvider} but factories may return `undefined` (no adapter / no CLI).
 * Used when a provider key is valid but needs no install (MCP-first data, etc.).
 */
export function resolveOptionalEnvProvider<P>(
  providerKey: string,
  adapters: Readonly<Record<string, (env: EnvSource) => P | undefined>>,
  env: EnvSource,
  defaultKey: string,
): P | undefined {
  const factory = adapters[providerKey] ?? adapters[defaultKey];
  if (!factory) {
    throw new Error(`No adapter registered for provider "${providerKey}"`);
  }
  return factory(env);
}
