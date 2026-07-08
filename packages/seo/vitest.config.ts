import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { createViteWorkspaceAliasPlugin } from '../../scripts/lib/tsupWorkspaceAliases.mjs';

const seoSubpathPrefix = '@vybekiit/seo/';

const seoSourcePath = (subpath: string): string =>
  fileURLToPath(new URL(`./src/${subpath}`, import.meta.url));

const seoSourceAliasPlugin = () => ({
  name: 'vybekiit-seo-source-alias',
  enforce: 'pre' as const,
  resolveId: (source: string): string | undefined => {
    if (source === '@vybekiit/seo') {
      return seoSourcePath('index.ts');
    }

    if (source.startsWith(seoSubpathPrefix)) {
      return seoSourcePath(source.slice(seoSubpathPrefix.length));
    }

    return void 0;
  },
});

export default defineConfig({
  plugins: [seoSourceAliasPlugin(), createViteWorkspaceAliasPlugin()],
});
