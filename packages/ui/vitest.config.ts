import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * Vitest for `@vybekiit/ui` primitives.
 *
 * - `jsdom` renders React off-browser.
 * - `react()` enables the automatic JSX runtime for `.tsx` tests.
 * - `globals: true` exposes `describe` / `it` / `expect`; setup adds jest-dom.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.tsx'],
  },
});
