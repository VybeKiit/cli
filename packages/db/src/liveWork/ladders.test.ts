import { describe, expect, it } from 'vitest';
import {
  DATA_PREFERENCE_LADDER,
  isDataLadderProvider,
  readDataPin,
  resolveDataLadderOrder,
} from './ladders';

describe('DATA_PREFERENCE_LADDER', () => {
  it('is supabase → neon → railway (ADR-0039)', () => {
    expect(DATA_PREFERENCE_LADDER).toEqual(['supabase', 'neon', 'railway']);
  });
});

describe('isDataLadderProvider', () => {
  it('accepts ladder ids only', () => {
    expect(isDataLadderProvider('neon')).toBe(true);
    expect(isDataLadderProvider('mongodb')).toBe(false);
    expect(isDataLadderProvider('local')).toBe(false);
  });
});

describe('resolveDataLadderOrder', () => {
  it('returns the full ladder when nothing is pinned', () => {
    expect(resolveDataLadderOrder({})).toEqual(['supabase', 'neon', 'railway']);
  });

  it('named vendor stick returns only that adapter', () => {
    expect(resolveDataLadderOrder({}, 'neon')).toEqual(['neon']);
    expect(resolveDataLadderOrder({ DATA_PROVIDER: 'supabase' }, 'railway')).toEqual(['railway']);
  });

  it('starts at the pin and keeps later fallbacks', () => {
    expect(resolveDataLadderOrder({ DATA_PROVIDER: 'neon' })).toEqual(['neon', 'railway']);
    expect(resolveDataLadderOrder({ DATA_PROVIDER: 'railway' })).toEqual(['railway']);
    expect(resolveDataLadderOrder({ DATA_PROVIDER: 'supabase' })).toEqual([
      'supabase',
      'neon',
      'railway',
    ]);
  });

  it('ignores off-ladder DATA_PROVIDER and uses the full ladder', () => {
    expect(resolveDataLadderOrder({ DATA_PROVIDER: 'mongodb' })).toEqual([
      'supabase',
      'neon',
      'railway',
    ]);
  });
});

describe('readDataPin', () => {
  it('reads ladder pins only', () => {
    expect(readDataPin({ DATA_PROVIDER: 'neon' })).toBe('neon');
    expect(readDataPin({})).toBeNull();
    expect(readDataPin({ DATA_PROVIDER: 'mongodb' })).toBeNull();
  });
});
