import { defineConfig } from 'tsup';

/** Browser-safe main entry + Node-only helpers (`loadEnvFile`) on `./node`. */
export default defineConfig({
  entry: ['src/index.ts', 'src/node.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
});
