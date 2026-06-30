import { defineConfig } from 'tsup';

/** Dual entry: full provider (Node) + browser-safe locale rules. */
export default defineConfig({
  entry: ['src/index.ts', 'src/locale-rules.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
});
