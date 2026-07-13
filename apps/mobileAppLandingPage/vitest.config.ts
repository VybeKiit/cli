import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

const dir = dirname(fileURLToPath(import.meta.url));

/**
 * Vitest config for the mobile-app landing page's component tests.
 *
 * - `jsdom` gives React a DOM to render into off-browser.
 * - `tsconfigPaths` makes the `@/*` alias resolve in tests exactly as in the app.
 * - `react()` enables the JSX/automatic-runtime transform for `.tsx` tests.
 * - `globals: true` exposes `describe`/`it`/`expect` without per-file imports; the
 *   setup file extends `expect` with jest-dom matchers.
 *
 * The reused `templates/web` blocks (App Store buttons, iPhone mockup) import via
 * their own `@/…` alias. The Next build rewrites those with a webpack plugin, but
 * Vitest runs on Vite — so we map the exact specifiers those files use onto this
 * app's local shims, resolving them the same way `tsc --noEmit` already does.
 */
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: [
      { find: /^@\/utils\/cx$/, replacement: resolve(dir, 'src/utils/cx.ts') },
      {
        find: /^@\/components\/blocks\/21st\/iphone-mockup$/,
        replacement: resolve(dir, 'src/components/blocks/21st/iphone-mockup.tsx'),
      },
    ],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
});
