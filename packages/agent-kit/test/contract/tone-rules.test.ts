import { describe, expect, it } from 'vitest';
import { TONE_RULES, renderToneSection } from '../../src/contract/tone-rules';

describe('renderToneSection', () => {
  it('renders the heading and every tone rule', () => {
    const md = renderToneSection();
    expect(md.startsWith('## Tone')).toBe(true);
    for (const rule of TONE_RULES) {
      expect(md).toContain(rule.text);
    }
  });

  it('bans em dashes and trailing punctuation in UI titles', () => {
    const md = renderToneSection();
    expect(md).toContain('No em dashes');
    expect(md).toContain('UI titles, nav labels, and section headings');
    expect(md).toContain('no trailing period, comma, or ellipsis');
  });
});
