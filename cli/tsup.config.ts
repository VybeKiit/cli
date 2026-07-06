import { defineConfig } from 'tsup';

// The CLI ships as a single ESM bin with a node shebang — it doesn't need the
// dual ESM/CJS + d.ts shape of the published library packages, so it uses its
// own config rather than the shared `tsup.base`.
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  clean: true,
  banner: { js: '#!/usr/bin/env node' },
  // Every @vybekiit/* package is private (ADR-0033) — never on npm — so the published CLI
  // (the single public artifact) must inline their source rather than declare unresolvable deps.
  noExternal: [/^@vybekiit\//],
});
