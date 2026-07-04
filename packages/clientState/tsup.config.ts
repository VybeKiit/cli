import { defineConfig } from 'tsup';
import { createWorkspaceAliasPlugin } from '../../scripts/lib/tsupWorkspaceAliases.mjs';

export default defineConfig({
  entry: ['src/index.ts', 'src/mobile/index.ts', 'src/web/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  external: ['react', 'react-native-mmkv'],
  esbuildPlugins: [createWorkspaceAliasPlugin()],
});
