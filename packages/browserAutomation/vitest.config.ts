import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Mirror the `@vybekiit/browser-automation/*` self-paths from tsconfig.base.json so tests
    // resolve source imports the same way `tsc` does. Subpath rule must precede the bare one.
    alias: [
      {
        find: /^@vybekiit\/browser-automation\/(.*)$/,
        replacement: path.resolve(import.meta.dirname, 'src/$1'),
      },
      {
        find: /^@vybekiit\/browser-automation$/,
        replacement: path.resolve(import.meta.dirname, 'src/index.ts'),
      },
      {
        find: /^@vybekiit\/deploy$/,
        replacement: path.resolve(import.meta.dirname, '../deploy/src/registrar/index.ts'),
      },
      {
        find: /^@vybekiit\/core$/,
        replacement: path.resolve(import.meta.dirname, '../core/src/index.ts'),
      },
    ],
  },
  test: {
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
  },
});
