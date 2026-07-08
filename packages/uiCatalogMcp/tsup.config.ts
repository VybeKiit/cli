import { defineConfig } from 'tsup';
import { createWorkspaceAliasPlugin } from '../../scripts/lib/tsupWorkspaceAliases.mjs';

export default defineConfig({
  entry: ['src/index.ts', 'src/bin.ts', 'src/catalog.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  banner: {
    js: '',
  },
  esbuildPlugins: [createWorkspaceAliasPlugin()],
});
