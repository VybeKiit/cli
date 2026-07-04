import { defineConfig } from 'vitest/config';
import { createViteWorkspaceAliasPlugin } from '../../scripts/lib/tsupWorkspaceAliases.mjs';

export default defineConfig({
  plugins: [createViteWorkspaceAliasPlugin()],
  test: { include: ['test/**/*.test.ts'] },
});
