import { describe, expect, it } from 'vitest';
import { CONTRACT, renderContract } from '../src/contract';

describe('renderContract', () => {
  it('renders the heading and all five rules in order', () => {
    const md = renderContract();
    expect(md.startsWith(`## ${CONTRACT.heading}`)).toBe(true);
    expect(md).toContain('① **One action at a time**');
    expect(md).toContain('② **Verify before advancing**');
    expect(md).toContain('③ **Plain language**');
    expect(md).toContain('④ **Translate errors**');
    expect(md).toContain('⑤ **Celebrate progress**');
  });

  it('keeps exactly five rules with stable 1-based ids', () => {
    expect(CONTRACT.rules).toHaveLength(5);
    expect(CONTRACT.rules.map((rule) => rule.id)).toEqual([1, 2, 3, 4, 5]);
  });
});
