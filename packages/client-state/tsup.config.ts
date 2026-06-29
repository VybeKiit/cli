import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/mobile/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  external: ['react', 'react-native-mmkv'],
});
