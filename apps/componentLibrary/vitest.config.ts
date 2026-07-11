import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * Vitest for component-library unit tests (page-recipe render smokes).
 *
 * Mirrors the app path aliases: `@/*` → templates/web, `@library/*` → this app's src.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, '../../templates/web/src'),
      '@library': path.resolve(rootDir, 'src'),
      '@vybekiit/ui': path.resolve(rootDir, '../../packages/ui/src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.tsx', 'src/**/*.test.ts'],
    // Full recipe registry can be slow under load.
    testTimeout: 30_000,
  },
});
