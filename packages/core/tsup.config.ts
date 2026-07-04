import { defineConfig } from 'tsup';
import { createWorkspaceAliasPlugin } from '../../scripts/lib/tsupWorkspaceAliases.mjs';

/**
 * Browser-safe main entry + Node-only helpers (`loadEnvFile`) on `./node`, plus the
 * foundation subpaths absorbed from the former standalone packages (ADR-0025):
 * `./http` (+ client/express/next), `./observability`, `./security` (+ express).
 */
export default defineConfig({
  entry: [
    'src/index.ts',
    'src/node.ts',
    'src/http/index.ts',
    'src/http/responseSchemas.ts',
    'src/http/client/index.ts',
    'src/http/express.ts',
    'src/http/next.ts',
    'src/observability/index.ts',
    'src/security/index.ts',
    'src/security/express.ts',
  ],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  esbuildPlugins: [createWorkspaceAliasPlugin()],
});
