import { defineConfig } from 'tsup';
import { createWorkspaceAliasPlugin } from '../../scripts/lib/tsupWorkspaceAliases.mjs';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/bin.ts',
    'src/automations.ts',
    'src/skills.ts',
    'src/commands.ts',
    'src/doctorTools.ts',
    'src/techSearch.ts',
    'src/uiCatalog/index.ts',
    'src/uiCatalog/catalog.ts',
    'src/uiCatalog/fuzzy.ts',
    'src/uiCatalog/page.ts',
  ],
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
