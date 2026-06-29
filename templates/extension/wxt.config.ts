import { resolve as pathResolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'wxt';

const extensionRoot = pathResolve(fileURLToPath(new URL('.', import.meta.url)));

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    resolve: {
      // WXT may rewrite storage helpers in workspace packages; resolve subpath from here.
      alias: {
        'wxt/utils/storage': pathResolve(extensionRoot, 'node_modules/wxt/dist/utils/storage.mjs'),
      },
    },
  }),
  manifest: {
    default_locale: 'en',
    name: '__MSG_ext.name__',
    description: '__MSG_ext.description__',
    permissions: ['storage'],
    host_permissions: ['http://localhost:3000/*', 'https://*/*'],
    icons: {
      16: 'icon/16.png',
      48: 'icon/48.png',
      128: 'icon/128.png',
    },
    background: {
      service_worker: 'background.js',
    },
  },
});
