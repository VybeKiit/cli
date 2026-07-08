import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { createViteWorkspaceAliasPlugin } from '../../scripts/lib/tsupWorkspaceAliases.mjs';

const tenancySubpathPrefix = '@vybekiit/tenancy/';

const tenancySourcePath = (subpath: string): string =>
  fileURLToPath(new URL(`./src/${subpath}`, import.meta.url));

const tenancySourceAliasPlugin = () => ({
  name: 'vybekiit-tenancy-source-alias',
  enforce: 'pre' as const,
  resolveId: (source: string): string | undefined => {
    if (source === '@vybekiit/tenancy') {
      return tenancySourcePath('index.ts');
    }

    if (source.startsWith(tenancySubpathPrefix)) {
      return tenancySourcePath(source.slice(tenancySubpathPrefix.length));
    }

    return void 0;
  },
});

export default defineConfig({
  plugins: [tenancySourceAliasPlugin(), createViteWorkspaceAliasPlugin()],
});
