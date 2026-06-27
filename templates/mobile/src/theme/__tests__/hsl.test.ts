import { describe, expect, it } from 'vitest';
import { toRnHsl } from '../hsl';

describe('toRnHsl', () => {
  it('converts space-separated channels to RN comma form', () => {
    expect(toRnHsl('0 0% 100%')).toBe('hsl(0, 0%, 100%)');
  });

  it('handles decimal channels (e.g. the destructive token)', () => {
    expect(toRnHsl('0 84.2% 60.2%')).toBe('hsl(0, 84.2%, 60.2%)');
  });

  it('handles the dark-foreground token', () => {
    expect(toRnHsl('0 0% 98%')).toBe('hsl(0, 0%, 98%)');
  });

  it('trims surrounding whitespace before converting', () => {
    expect(toRnHsl('  0 0% 3.9%  ')).toBe('hsl(0, 0%, 3.9%)');
  });

  it('throws when the channel count is wrong so a bad token fails loudly', () => {
    expect(() => toRnHsl('0 100%')).toThrow();
    expect(() => toRnHsl('0 0% 50% 1')).toThrow();
    expect(() => toRnHsl('')).toThrow();
  });
});
