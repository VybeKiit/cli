import { defineConfig } from 'tsup';

// Three entries mirror @vybekiit/report-mode's split so DOM/Node code never cross-bundles:
//   .      → pure headless (schema/context/usage/affiliate), safe anywhere
//   ./node → the CLI-spawning SSE bridge (Node only; never reaches the browser)
//   ./web  → the React EventSource hook (DOM only; never reaches the bridge)
// react + the sibling @vybekiit/report-mode package stay external (peer/runtime deps).
export default defineConfig({
  entry: ['src/index.ts', 'src/node/index.ts', 'src/node/bin.ts', 'src/web/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  external: ['react', '@vybekiit/report-mode'],
});
