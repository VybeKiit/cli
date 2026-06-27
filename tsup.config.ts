import { defineConfig } from 'tsup';

// The CLI ships as a single ESM bin with a node shebang — it doesn't need the
// dual ESM/CJS + d.ts shape of the published library packages, so it uses its
// own config rather than the shared `tsup.base`.
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  clean: true,
  banner: { js: '#!/usr/bin/env node' },
});
