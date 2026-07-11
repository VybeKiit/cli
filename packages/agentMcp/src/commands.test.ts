import { describe, expect, it } from 'vitest';
import { getCommand, searchCommands } from './commands.js';

describe('searchCommands', () => {
  it('finds doctor by name', () => {
    const page = searchCommands('doctor');
    expect(page.items.some((item) => item.name === 'doctor')).toBe(true);
  });

  it('finds doc-fallback by purpose', () => {
    const page = searchCommands('official docs');
    expect(page.items.some((item) => item.name === 'doc-fallback')).toBe(true);
  });

  it('paginates the full catalog', () => {
    const first = searchCommands('', { limit: 5 });
    expect(first.items).toHaveLength(5);
    expect(first.total).toBeGreaterThan(5);
    expect(first.hasMore).toBe(true);
  });
});

describe('getCommand', () => {
  it('returns usage for known verbs', () => {
    expect(getCommand('doc-fallback')?.usage).toContain('doc-fallback');
    expect(getCommand('nope')).toBeUndefined();
  });
});
