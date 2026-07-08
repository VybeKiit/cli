import { defineConfig } from 'tsup';

// Root entry carries the framework-free step types; the web entry carries the
// React hook. Kept split so non-DOM consumers never bundle React. Mirrors @vybekiit/report-mode.
export default defineConfig({
  entry: ['src/index.ts', 'src/web/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  external: ['react'],
});
