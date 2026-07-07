import { defineConfig } from 'tsup';
import { createWorkspaceAliasPlugin } from '../../scripts/lib/tsupWorkspaceAliases.mjs';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    regions: 'src/regions.ts',
    schema: 'src/schema.ts',
    types: 'src/types.ts',
    'cli/index': 'src/cli/main.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  esbuildPlugins: [createWorkspaceAliasPlugin()],
});
