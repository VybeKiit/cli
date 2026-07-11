import { describe, expect, it } from 'vitest';
import { decodeCursor, encodeCursor, MAX_PAGE_LIMIT, paginate, resolvePageLimit } from './page.js';

describe('cursor codec', () => {
  it('round-trips offsets', () => {
    expect(decodeCursor(encodeCursor(0))).toBe(0);
    expect(decodeCursor(encodeCursor(42))).toBe(42);
  });

  it('treats bad cursors as offset 0', () => {
    expect(decodeCursor(undefined)).toBe(0);
    expect(decodeCursor('not-valid!!!')).toBe(0);
  });
});

describe('resolvePageLimit', () => {
  it('clamps into 1..MAX', () => {
    expect(resolvePageLimit(undefined)).toBe(20);
    expect(resolvePageLimit(0)).toBe(1);
    expect(resolvePageLimit(999)).toBe(MAX_PAGE_LIMIT);
  });
});

describe('paginate', () => {
  it('returns first page with nextCursor when more remain', () => {
    const page = paginate(['a', 'b', 'c', 'd'], { limit: 2 });
    expect(page.items).toEqual(['a', 'b']);
    expect(page.total).toBe(4);
    expect(page.hasMore).toBe(true);
    expect(page.nextCursor).not.toBeNull();

    const second = paginate(
      ['a', 'b', 'c', 'd'],
      page.nextCursor === null || page.nextCursor === undefined
        ? { limit: 2 }
        : { limit: 2, cursor: page.nextCursor },
    );
    expect(second.items).toEqual(['c', 'd']);
    expect(second.hasMore).toBe(false);
    expect(second.nextCursor).toBeNull();
  });
});
