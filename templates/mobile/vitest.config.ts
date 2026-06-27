import path from 'node:path';
import { defineConfig } from 'vitest/config';

/**
 * Vitest config for the mobile template's PURE TypeScript tests only.
 *
 * Component tests that render React Native need the `jest-expo` preset (a Jest
 * transform that stubs the native modules); that is out of scope here. So this
 * config runs in plain Node and we test only modules with no `react-native`
 * import: the HSL→RN color converter and the auth/billing `Result` stubs.
 *
 * The `@/*` alias is wired so those modules can import via the same paths the app
 * uses. No jsdom/react plugin is needed — nothing under test touches the DOM.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
