import { describe, expect, it } from 'vitest';
import { levenshtein, scoreQuery, scoreTerm, tokenize } from './fuzzy.js';

describe('tokenize', () => {
  it('splits and lowercases terms', () => {
    expect(tokenize('  Animated   HERO ')).toEqual(['animated', 'hero']);
  });
});

describe('levenshtein', () => {
  it('scores exact and single-edit typos', () => {
    expect(levenshtein('hero', 'hero')).toBe(0);
    expect(levenshtein('hero', 'herro', 2)).toBe(1);
    expect(levenshtein('hero', 'zzzzz', 2)).toBeGreaterThan(2);
  });
});

describe('scoreTerm', () => {
  it('ranks exact > prefix > includes > subsequence > typo', () => {
    const exact = scoreTerm('hero', 'hero');
    const prefix = scoreTerm('hero', 'hero-parallax');
    const includes = scoreTerm('hero', 'big-hero-section');
    const subseq = scoreTerm('hrp', 'hero-parallax');
    const typo = scoreTerm('herro', 'hero parallax');
    const miss = scoreTerm('pricing', 'hero-parallax');

    expect(exact).toBeGreaterThan(prefix);
    expect(prefix).toBeGreaterThan(includes);
    expect(includes).toBeGreaterThan(subseq);
    expect(typo).toBeGreaterThan(0);
    expect(miss).toBe(0);
  });
});

describe('scoreQuery', () => {
  it('requires every term to match in all mode', () => {
    expect(scoreQuery('animated hero', ['hero-parallax', 'animated marketing'])).toBeGreaterThan(0);
    expect(scoreQuery('animated pricing', ['hero-parallax', 'animated marketing'])).toBe(0);
  });

  it('allows partial phrases in any mode', () => {
    expect(scoreQuery('animated hero landing', ['hero-parallax'], 'any')).toBeGreaterThan(0);
    expect(scoreQuery('animated hero landing', ['hero-parallax'], 'all')).toBe(0);
  });

  it('tolerates typos across multi-field haystacks', () => {
    expect(scoreQuery('herro', ['hero-parallax', 'landing'])).toBeGreaterThan(0);
  });
});
