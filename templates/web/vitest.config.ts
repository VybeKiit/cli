import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';
import { createViteWorkspaceAliasPlugin } from '../../scripts/lib/tsupWorkspaceAliases.mjs';

/**
 * Vitest config for the web template's component and hook tests.
 *
 * - `jsdom` gives React a DOM to render into off-browser.
 * - `tsconfigPaths` makes the `@/*` alias resolve in tests exactly as in the app.
 * - `react()` enables JSX/automatic-runtime transform for `.tsx` tests.
 * - `globals: true` exposes `describe`/`it`/`expect` without per-file imports
 *   (types wired via `tsconfig`'s `vitest/globals`); the setup file extends
 *   `expect` with jest-dom matchers.
 */
export default defineConfig({
  plugins: [createViteWorkspaceAliasPlugin(), react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    exclude: ['**/node_modules/**', '**/e2e/**'],
  },
});
