import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { createViteWorkspaceAliasPlugin } from '../../scripts/lib/tsupWorkspaceAliases.mjs';

const complianceSubpathPrefix = '@vybekiit/compliance/';

const complianceSourcePath = (subpath: string): string =>
  fileURLToPath(new URL(`./src/${subpath}`, import.meta.url));

const complianceSourceAliasPlugin = () => ({
  name: 'vybekiit-compliance-source-alias',
  enforce: 'pre' as const,
  resolveId: (source: string): string | undefined => {
    if (source === '@vybekiit/compliance') {
      return complianceSourcePath('index.ts');
    }

    if (source.startsWith(complianceSubpathPrefix)) {
      return complianceSourcePath(source.slice(complianceSubpathPrefix.length));
    }

    return void 0;
  },
});

export default defineConfig({
  plugins: [complianceSourceAliasPlugin(), createViteWorkspaceAliasPlugin()],
});
