import { defineConfig } from 'tsup';

/**
 * Multi-entry build: this package exposes subpath exports (`./regions`, `./schema`,
 * `./types`) that generated buyer files import directly, so each needs its own dist
 * entry — it can't use the shared single-entry `tsup.base` like the other packages.
 */
export default defineConfig({
  entry: ['src/index.ts', 'src/regions.ts', 'src/schema.ts', 'src/types.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
});
