import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { createViteWorkspaceAliasPlugin } from '../../scripts/lib/tsupWorkspaceAliases.mjs';

const i18nSubpathPrefix = '@vybekiit/i18n/';

const i18nSourcePath = (subpath: string): string =>
  fileURLToPath(new URL(`./src/${subpath}`, import.meta.url));

const i18nSourceAliasPlugin = () => ({
  name: 'vybekiit-i18n-source-alias',
  enforce: 'pre' as const,
  resolveId: (source: string): string | undefined => {
    if (source === '@vybekiit/i18n') {
      return i18nSourcePath('index.ts');
    }

    if (source.startsWith(i18nSubpathPrefix)) {
      return i18nSourcePath(source.slice(i18nSubpathPrefix.length));
    }

    return void 0;
  },
});

export default defineConfig({
  plugins: [i18nSourceAliasPlugin(), createViteWorkspaceAliasPlugin()],
});
