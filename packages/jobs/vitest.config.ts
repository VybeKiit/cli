import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { createViteWorkspaceAliasPlugin } from '../../scripts/lib/tsupWorkspaceAliases.mjs';

const jobsSubpathPrefix = '@vybekiit/jobs/';

const jobsSourcePath = (subpath: string): string =>
  fileURLToPath(new URL(`./src/${subpath}`, import.meta.url));

const jobsSourceAliasPlugin = () => ({
  name: 'vybekiit-jobs-source-alias',
  enforce: 'pre' as const,
  resolveId: (source: string): string | undefined => {
    if (source === '@vybekiit/jobs') {
      return jobsSourcePath('index.ts');
    }

    if (source.startsWith(jobsSubpathPrefix)) {
      return jobsSourcePath(source.slice(jobsSubpathPrefix.length));
    }

    return void 0;
  },
});

export default defineConfig({
  plugins: [jobsSourceAliasPlugin(), createViteWorkspaceAliasPlugin()],
});
