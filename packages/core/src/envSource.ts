/** A readable view of `process.env` without requiring `@types/node` in consumers. */
export type EnvSource = Record<string, string | undefined>;

/**
 * Resolve a provider adapter from a parsed provider key.
 * Keeps per-package factories while centralizing switch shape (ADR-0002).
 *
 * @param providerKey - Parsed provider value from the concern config schema.
 * @param adapters - Registered provider factories keyed by config value.
 * @param env - Raw environment source passed to the selected factory.
 * @param defaultKey - Legacy parameter kept for compatibility; defaults now live in config.
 * @returns The provider created by the registered factory.
 * @throws When `providerKey` is not registered in `adapters`.
 * @example
 * const provider = resolveEnvProvider('stripe', adapters, process.env, 'lemon-squeezy');
 */
export const resolveEnvProvider = <P>(
  providerKey: string,
  adapters: Readonly<Record<string, (env: EnvSource) => P>>,
  env: EnvSource,
  defaultKey: string,
): P => {
  const factory = adapters[providerKey];
  if (!factory) {
    throw new Error(
      `No adapter registered for provider "${providerKey}" (default "${defaultKey}" is config-only)`,
    );
  }
  return factory(env);
};

/**
 * Like {@link resolveEnvProvider} but factories may return `undefined` (no adapter / no CLI).
 * Used when a provider key is valid but needs no install (MCP-first data, etc.).
 *
 * @param providerKey - Parsed provider value from the concern config schema.
 * @param adapters - Registered optional provider factories keyed by config value.
 * @param env - Raw environment source passed to the selected factory.
 * @param defaultKey - Legacy parameter kept for compatibility; defaults now live in config.
 * @returns The provider from the registered factory, or `undefined` when the provider has no tool.
 * @throws When `providerKey` is not registered in `adapters`.
 * @example
 * const tool = resolveOptionalEnvProvider('supabase', tools, process.env, 'local');
 */
export const resolveOptionalEnvProvider = <P>(
  providerKey: string,
  adapters: Readonly<Record<string, (env: EnvSource) => P | undefined>>,
  env: EnvSource,
  defaultKey: string,
): P | undefined => {
  const factory = adapters[providerKey];
  if (!factory) {
    throw new Error(
      `No adapter registered for provider "${providerKey}" (default "${defaultKey}" is config-only)`,
    );
  }
  return factory(env);
};
