import { describe, expect, it } from 'vitest';
import { shouldCopyScaffoldPath } from '../src/lib/scaffold';

describe('shouldCopyScaffoldPath', () => {
  it('keeps buyer scripts', () => {
    expect(shouldCopyScaffoldPath('/tmp/templates/web/scripts/runE2e.mjs')).toBe(true);
    expect(shouldCopyScaffoldPath('/tmp/templates/web/scripts/checkAgentPatterns.mjs')).toBe(true);
  });

  it('skips scripts/dev maintainer scratch', () => {
    expect(shouldCopyScaffoldPath('/tmp/templates/web/scripts/dev/local.mjs')).toBe(false);
    expect(shouldCopyScaffoldPath('/tmp/templates/web/scripts/dev')).toBe(false);
  });

  it('skips build artifact dirs by basename', () => {
    expect(shouldCopyScaffoldPath('/tmp/templates/web/node_modules/pkg')).toBe(false);
    expect(shouldCopyScaffoldPath('/tmp/templates/web/.next/server')).toBe(false);
  });
});
