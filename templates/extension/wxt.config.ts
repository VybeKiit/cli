import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
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
