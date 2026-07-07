import { defineConfig } from 'tsup';
import { createWorkspaceAliasPlugin } from '../../scripts/lib/tsupWorkspaceAliases.mjs';

/**
 * Browser-safe main entry + Node-only helpers (`loadEnvFile`) on `./node`, plus the
 * foundation subpaths absorbed from the former standalone packages (ADR-0025):
 * `./http` (+ client/express/next), `./observability`, `./security` (+ express).
 */
export default defineConfig({
  entry: ['src/**/*.ts', '!src/**/*.test.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  esbuildPlugins: [createWorkspaceAliasPlugin()],
});
