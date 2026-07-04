#!/usr/bin/env node
/** Patch all package tsup.config.ts files with workspace alias plugin. */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { repoRootFrom } from '../../lib/repoRoot.mjs';

const ROOT = join(repoRootFrom(import.meta.url), 'packages');
const PLUGIN_IMPORT =
  "import { createWorkspaceAliasPlugin } from '../../scripts/lib/tsupWorkspaceAliases.mjs';";
const PLUGIN_LINE = '  esbuildPlugins: [createWorkspaceAliasPlugin()],';

for (const name of readdirSync(ROOT)) {
  const tsupPath = join(ROOT, name, 'tsup.config.ts');
  if (!existsSync(tsupPath)) continue;
  let src = readFileSync(tsupPath, 'utf8');
  if (src.includes('createWorkspaceAliasPlugin')) continue;
  if (!src.includes('createWorkspaceAliasPlugin')) {
    src = src.replace(
      "import { defineConfig } from 'tsup';",
      `import { defineConfig } from 'tsup';\nimport { createWorkspaceAliasPlugin } from '../../scripts/lib/tsupWorkspaceAliases.mjs';`,
    );
  }
  if (!src.includes('esbuildPlugins:')) {
    // Insert plugin before closing `});` — e.g. `\n});\n` at end of defineConfig(...)
    src = src.replace(/(\n}\);\n$)/, ',\n  esbuildPlugins: [createWorkspaceAliasPlugin()],\n});\n');
  }
  writeFileSync(tsupPath, src);
}
console.log('Patched tsup configs with workspace alias plugin.');
