import { describe, expect, it } from 'vitest';
import {
  buildMemoryBlock,
  upsertMemoryBlock,
  withStatusLineBadge,
} from '../../src/global/awareness';

describe('upsertMemoryBlock', () => {
  const block = buildMemoryBlock();

  it('inserts the block into empty content', () => {
    expect(upsertMemoryBlock('', block)).toBe(block);
  });

  it('appends after existing user content', () => {
    const result = upsertMemoryBlock('# My notes\n', block);
    expect(result.startsWith('# My notes')).toBe(true);
    expect(result).toContain('BEGIN VYBEKIIT');
  });

  it('is idempotent — replaces its own block, never duplicates', () => {
    const once = upsertMemoryBlock('# My notes\n', block);
    const twice = upsertMemoryBlock(once, block);
    expect(twice).toBe(once);
    expect(twice.match(/BEGIN VYBEKIIT/g)?.length).toBe(1);
  });

  it('preserves user content on both sides of the block', () => {
    const result = upsertMemoryBlock(`before\n\n${block}\nafter`, block);
    expect(result).toContain('before');
    expect(result).toContain('after');
  });
});

describe('withStatusLineBadge', () => {
  it('sets a badge when none is configured', () => {
    const next = withStatusLineBadge('{}');
    expect(next).not.toBeNull();
    expect(next).toContain('vybekiit');
  });

  it('leaves an existing status line untouched', () => {
    expect(withStatusLineBadge('{"statusLine":{"type":"command","command":"mine"}}')).toBeNull();
  });

  it('never overwrites malformed settings', () => {
    expect(withStatusLineBadge('{ not json')).toBeNull();
  });
});
