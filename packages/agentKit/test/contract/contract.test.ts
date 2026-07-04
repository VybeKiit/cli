import { CONTRACT, renderContract } from '@vybekiit/agentKit/contract/contract';
import { describe, expect, it } from 'vitest';

describe('renderContract', () => {
  it('renders the heading and all seven rules in order', () => {
    const md = renderContract();
    expect(md.startsWith(`## ${CONTRACT.heading}`)).toBe(true);
    expect(md).toContain('① **One action at a time**');
    expect(md).toContain('⑦ **Official source fallback**');
  });

  it('keeps exactly seven rules with stable 1-based ids', () => {
    expect(CONTRACT.rules).toHaveLength(7);
    expect(CONTRACT.rules.map((rule) => rule.id)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
});
