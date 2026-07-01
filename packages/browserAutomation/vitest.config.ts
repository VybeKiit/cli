import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@vybekiit/deploy': path.resolve(import.meta.dirname, '../deploy/src/registrar/index.ts'),
      '@vybekiit/core': path.resolve(import.meta.dirname, '../core/src/index.ts'),
    },
  },
  test: {
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
  },
});
