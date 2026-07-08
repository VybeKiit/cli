import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { createViteWorkspaceAliasPlugin } from '../../scripts/lib/tsupWorkspaceAliases.mjs';

const realtimeSubpathPrefix = '@vybekiit/realtime/';

const realtimeSourcePath = (subpath: string): string =>
  fileURLToPath(new URL(`./src/${subpath}`, import.meta.url));

const realtimeSourceAliasPlugin = () => ({
  name: 'vybekiit-realtime-source-alias',
  enforce: 'pre' as const,
  resolveId: (source: string): string | undefined => {
    if (source === '@vybekiit/realtime') {
      return realtimeSourcePath('index.ts');
    }

    if (source.startsWith(realtimeSubpathPrefix)) {
      return realtimeSourcePath(source.slice(realtimeSubpathPrefix.length));
    }

    return void 0;
  },
});

export default defineConfig({
  plugins: [realtimeSourceAliasPlugin(), createViteWorkspaceAliasPlugin()],
});
