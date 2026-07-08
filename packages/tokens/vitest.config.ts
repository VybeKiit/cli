import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { createViteWorkspaceAliasPlugin } from '../../scripts/lib/tsupWorkspaceAliases.mjs';

const tokensSubpathPrefix = '@vybekiit/tokens/';

const tokensSourcePath = (subpath: string): string =>
  fileURLToPath(new URL(`./src/${subpath}`, import.meta.url));

const tokensSourceAliasPlugin = () => ({
  name: 'vybekiit-tokens-source-alias',
  enforce: 'pre' as const,
  resolveId: (source: string): string | undefined => {
    if (source === '@vybekiit/tokens') {
      return tokensSourcePath('index.ts');
    }

    if (source.startsWith(tokensSubpathPrefix)) {
      return tokensSourcePath(source.slice(tokensSubpathPrefix.length));
    }

    return void 0;
  },
});

export default defineConfig({
  plugins: [tokensSourceAliasPlugin(), createViteWorkspaceAliasPlugin()],
});
