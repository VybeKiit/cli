import { resolve as pathResolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'wxt';
import process from 'node:process';

const extensionRoot = pathResolve(fileURLToPath(new URL('.', import.meta.url)));

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  dev: {
    server: {
      port: Number(process.env.PLAYWRIGHT_PORT ?? process.env.WXT_DEV_SERVER_PORT ?? 3010),
    },
  },
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
    name: '__MSG_ext_name__',
    description: '__MSG_ext_description__',
    permissions: ['storage', 'sidePanel'],
    host_permissions: [
      'http://localhost:3000/*',
      'http://localhost:3001/*',
      'http://localhost:3002/*',
      'https://*/*',
    ],
    icons: {
      16: 'icon/16.png',
      48: 'icon/48.png',
      128: 'icon/128.png',
    },
    side_panel: {
      default_path: 'sidepanel.html',
    },
    background: {
      service_worker: 'background.js',
    },
  },
});
