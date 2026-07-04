import { defineConfig } from 'tsup';
import { createWorkspaceAliasPlugin } from '../../scripts/lib/tsupWorkspaceAliases.mjs';

export default defineConfig({
  entry: ['src/index.ts', 'src/http/index.ts', 'src/http/express.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  external: ['express'],
  esbuildPlugins: [createWorkspaceAliasPlugin()],
});
