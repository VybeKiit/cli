import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { createViteWorkspaceAliasPlugin } from '../../scripts/lib/tsupWorkspaceAliases.mjs';

const notificationsSubpathPrefix = '@vybekiit/notifications/';

const notificationsSourcePath = (subpath: string): string =>
  fileURLToPath(new URL(`./src/${subpath}`, import.meta.url));

const notificationsSourceAliasPlugin = () => ({
  name: 'vybekiit-notifications-source-alias',
  enforce: 'pre' as const,
  resolveId: (source: string): string | undefined => {
    if (source === '@vybekiit/notifications') {
      return notificationsSourcePath('index.ts');
    }

    if (source.startsWith(notificationsSubpathPrefix)) {
      return notificationsSourcePath(source.slice(notificationsSubpathPrefix.length));
    }

    return void 0;
  },
});

export default defineConfig({
  plugins: [notificationsSourceAliasPlugin(), createViteWorkspaceAliasPlugin()],
});
