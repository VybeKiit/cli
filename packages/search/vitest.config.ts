import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { createViteWorkspaceAliasPlugin } from '../../scripts/lib/tsupWorkspaceAliases.mjs';

const searchSubpathPrefix = '@vybekiit/search/';

const searchSourcePath = (subpath: string): string =>
  fileURLToPath(new URL(`./src/${subpath}`, import.meta.url));

const searchSourceAliasPlugin = () => ({
  name: 'vybekiit-search-source-alias',
  enforce: 'pre' as const,
  resolveId: (source: string): string | undefined => {
    if (source === '@vybekiit/search') {
      return searchSourcePath('index.ts');
    }

    if (source.startsWith(searchSubpathPrefix)) {
      return searchSourcePath(source.slice(searchSubpathPrefix.length));
    }

    return void 0;
  },
});

export default defineConfig({
  plugins: [searchSourceAliasPlugin(), createViteWorkspaceAliasPlugin()],
});
