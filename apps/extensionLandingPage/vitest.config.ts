import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

const dir = dirname(fileURLToPath(import.meta.url));

/**
 * Vitest config for the extension landing page component tests.
 *
 * - `jsdom` gives React a DOM to render into off-browser.
 * - `tsconfigPaths` makes the `@/*` alias resolve in tests exactly as in the app.
 * - `react()` enables the JSX/automatic-runtime transform for `.tsx` tests.
 * - `globals: true` exposes `describe`/`it`/`expect` without per-file imports; the
 *   setup file extends `expect` with jest-dom matchers.
 *
 * The reused `templates/web` browser-window block imports via its own `@/…` alias.
 * The Next build rewrites that with a webpack plugin, but Vitest runs on Vite — so
 * we map the exact `@/lib/utils` specifier onto this app's local shim, resolving it
 * the same way `tsc --noEmit` already does.
 */
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: [{ find: /^@\/lib\/utils$/, replacement: resolve(dir, 'src/lib/utils.ts') }],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
});
