import { describe, expect, it } from 'vitest';
import {
  shouldCopyDeliveryPath,
  shouldCopyDropPath,
  shouldCopyKitPath,
  shouldCopyScaffoldPath,
} from './deliveryCopyPolicy';

describe('deliveryCopyPolicy', () => {
  it('skips node_modules and dist for all profiles', () => {
    expect(shouldCopyScaffoldPath('a/node_modules/x')).toBe(false);
    expect(shouldCopyDropPath('a/dist/x')).toBe(false);
    expect(shouldCopyKitPath('a/.turbo/x')).toBe(false);
  });

  it('skips scripts/dev only for scaffold', () => {
    expect(shouldCopyScaffoldPath('templates/web/scripts/dev/foo.mjs')).toBe(false);
    expect(shouldCopyDropPath('templates/web/scripts/dev/foo.mjs')).toBe(true);
  });

  it('allows normal source paths', () => {
    expect(shouldCopyDeliveryPath('templates/web/src/app/page.tsx', 'scaffold')).toBe(true);
    expect(shouldCopyKitPath('packages/core/src/index.ts')).toBe(true);
  });
});
