import { describe, expect, it } from 'vitest';
import { colors, cssVariables, hsl, radius } from '../src';

describe('colors', () => {
  it('encodes the exact light + dark base values', () => {
    expect(colors.light.background).toBe('0 0% 100%');
    expect(colors.dark.background).toBe('0 0% 3.9%');
    expect(colors.light.destructive).toBe('0 84.2% 60.2%');
  });
});

describe('hsl', () => {
  it('wraps raw channels into an hsl() string', () => {
    expect(hsl('0 0% 100%')).toBe('hsl(0 0% 100%)');
  });
});

describe('cssVariables', () => {
  it('emits kebab-case vars for a theme', () => {
    const dark = cssVariables('dark');
    expect(dark['--background']).toBe('0 0% 3.9%');
    expect(dark['--card-foreground']).toBe('0 0% 98%');
    expect(dark['--radius']).toBe(radius.base);
  });

  it('emits the light palette distinctly', () => {
    expect(cssVariables('light')['--background']).toBe('0 0% 100%');
  });
});
