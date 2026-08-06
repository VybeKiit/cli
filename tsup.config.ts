import { defineConfig } from 'tsup';

export default defineConfig({
  // Single `bin` entry — the package.json bin. We deliberately do NOT emit a second
  // `index` re-export: nothing imports the CLI as a library, and the old dist/index.js
  // shim was dead weight (a thin re-export no one consumed).
  //
  // We do NOT bundle the first-party `vybekiit` MCP server here: it depends on
  // @vybekiit/browser-automation -> playwright-core -> chromium-bidi, which esbuild
  // cannot bundle. That server stays project-scoped (doctor wires it per project). The
  // GLOBAL install registers the zero-config `playwright` + `context7` MCPs via
  // `claude mcp add -s user` instead — no bundling required.
  entry: { bin: 'src/bin.ts' },
  format: ['esm'],
  platform: 'node',
  // With one entry there is no shared chunk to split, but we pin this off anyway:
  // code-splitting is exactly what broke the published CLI — it moved the bin's
  // main-module guard into a chunk whose import.meta.url no longer matched
  // process.argv[1], so the CLI silently no-opped. Off = one self-contained bin.js.
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
