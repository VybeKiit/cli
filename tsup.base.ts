import { defineConfig } from 'tsup';

/**
 * Shared tsup build config for every published `@vybekiit/*` package.
 *
 * Why one source of truth: all maintained packages ship identical dual-format
 * (ESM + CJS) builds with type declarations, so the build shape lives here and
 * each package re-exports it — a config change happens in exactly one place.
 * Each package runs tsup from its own dir, so `src/index.ts` resolves per-package.
 */
export const baseTsup = defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
});
