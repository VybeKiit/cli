import { replaceGeneratedSection, wrapGeneratedSection } from '@vybekiit/agentKit/render/markdown';
import { describe, expect, it } from 'vitest';

describe('replaceGeneratedSection', () => {
  it('wraps and replaces marked sections', () => {
    const original = '# Title\n\nSome prose.\n';
    const updated = replaceGeneratedSection(original, 'contract', '## Contract\n\nRules here.');
    expect(updated).toContain('vybekiit:generated:start contract');
    expect(updated).toContain('## Contract');
  });

  it('replaces existing marked section in place', () => {
    const original = `# Title\n\n${wrapGeneratedSection('contract', 'old')}\n`;
    const updated = replaceGeneratedSection(original, 'contract', 'new content');
    expect(updated).toContain('new content');
    expect(updated).not.toContain('old');
    expect(updated.match(/vybekiit:generated:start contract/g)?.length).toBe(1);
  });
});
