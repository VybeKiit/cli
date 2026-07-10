import { defineConfig } from 'vitest/config';

/**
 * Scoped runner for root-level maintainer scripts (the mirror sync, etc.). `scripts/` is
 * deliberately NOT a pnpm workspace member — it ships no package and isn't built — so its
 * tests run via this config (`pnpm test:scripts`) rather than the turbo `test` pipeline.
 */
export default defineConfig({
  test: {
    include: ['**/*.test.mjs'],
    environment: 'node',
    // Preflight, agnix, and brand-asset sync scan the full monorepo and can take
    // tens of seconds under load (quiet machine ~6–8s; concurrent verify runs worse).
    testTimeout: 60_000,
  },
});
