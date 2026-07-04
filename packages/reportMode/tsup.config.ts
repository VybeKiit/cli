import { defineConfig } from 'tsup';

// Extends the shared build shape with a web-only React-hooks entry (`./web`), kept
// out of the root entry so non-DOM consumers never bundle React. Mirrors @vybekiit/client-state.
export default defineConfig({
  entry: ['src/index.ts', 'src/web/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  external: ['react'],
});
