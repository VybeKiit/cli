import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

/**
 * Vitest config for the store's component tests.
 *
 * - `jsdom` gives React a DOM to render into off-browser.
 * - `tsconfigPaths` makes the `@/*` alias resolve in tests exactly as in the app.
 * - `react()` enables the JSX/automatic-runtime transform for `.tsx` tests.
 * - `globals: true` exposes `describe`/`it`/`expect` without per-file imports; the
 *   setup file extends `expect` with jest-dom matchers.
 */
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
});
