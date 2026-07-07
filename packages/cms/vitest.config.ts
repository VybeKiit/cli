import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { createViteWorkspaceAliasPlugin } from '../../scripts/lib/tsupWorkspaceAliases.mjs';

const cmsSubpathPrefix = '@vybekiit/cms/';

const cmsSourcePath = (subpath: string): string =>
  fileURLToPath(new URL(`./src/${subpath}`, import.meta.url));

const cmsSourceAliasPlugin = () => ({
  name: 'vybekiit-cms-source-alias',
  enforce: 'pre' as const,
  resolveId: (source: string): string | undefined => {
    if (source === '@vybekiit/cms') {
      return cmsSourcePath('index.ts');
    }

    if (source.startsWith(cmsSubpathPrefix)) {
      return cmsSourcePath(source.slice(cmsSubpathPrefix.length));
    }

    return void 0;
  },
});

export default defineConfig({
  plugins: [cmsSourceAliasPlugin(), createViteWorkspaceAliasPlugin()],
});
