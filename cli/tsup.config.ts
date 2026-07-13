import { defineConfig } from 'tsup';

// The CLI ships as a single ESM bin with a node shebang — it doesn't need the
// dual ESM/CJS + d.ts shape of the published library packages, so it uses its
// own config rather than the shared `tsup.base`.
export default defineConfig({
  // `bin` is the package.json bin entry. `index` keeps older global shims that still
  // point at `dist/index.js` working after the entry was renamed to `bin.js`.
  entry: {
    bin: 'src/bin.ts',
    index: 'src/bin.ts',
  },
  format: ['esm'],
  platform: 'node',
  // Keep bin self-contained. Code-splitting moved top-level await into a chunk whose
  // import.meta.url no longer matches process.argv[1], so the CLI exited as a no-op.
  splitting: false,
  clean: true,
  banner: { js: '#!/usr/bin/env node' },
  // Every @vybekiit/* package is private (ADR-0033) — never on npm — so the published CLI
  // (the single public artifact) must inline their source rather than declare unresolvable deps.
  noExternal: [/^@vybekiit\//],
  // CJS SDKs pulled in via inlined @vybekiit/db break in the ESM bin
  // ("Dynamic require of fs/timers/promises is not supported"). Keep them external
  // and listed in package.json dependencies so Node can load them at runtime.
  external: [
    /^firebase-admin(\/|$)/,
    'mongodb',
    /^@aws-sdk\//,
    '@neondatabase/serverless',
    '@supabase/supabase-js',
  ],
});
