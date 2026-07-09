import { defineConfig } from 'tsup';
import { createWorkspaceAliasPlugin } from '../../scripts/lib/tsupWorkspaceAliases.mjs';

export default defineConfig({
  // src/admin/** is operator-only tooling (SDK webhook CRUD, run via tsx) — never shipped.
  entry: ['src/**/*.ts', '!src/**/*.test.ts', '!src/admin/**'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  external: ['express'],
  esbuildPlugins: [createWorkspaceAliasPlugin()],
});
