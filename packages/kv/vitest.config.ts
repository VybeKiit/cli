import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { createViteWorkspaceAliasPlugin } from '../../scripts/lib/tsupWorkspaceAliases.mjs';

const kvSubpathPrefix = '@vybekiit/kv/';

const kvSourcePath = (subpath: string): string =>
  fileURLToPath(new URL(`./src/${subpath}`, import.meta.url));

const kvSourceAliasPlugin = () => ({
  name: 'vybekiit-kv-source-alias',
  enforce: 'pre' as const,
  resolveId: (source: string): string | undefined => {
    if (source === '@vybekiit/kv') {
      return kvSourcePath('index.ts');
    }

    if (source.startsWith(kvSubpathPrefix)) {
      return kvSourcePath(source.slice(kvSubpathPrefix.length));
    }

    return void 0;
  },
});

export default defineConfig({
  plugins: [kvSourceAliasPlugin(), createViteWorkspaceAliasPlugin()],
});
