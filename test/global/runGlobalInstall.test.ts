import { describe, expect, it } from 'vitest';
import { formatGlobalInstallSummary } from '../../src/global/runGlobalInstall';

describe('formatGlobalInstallSummary', () => {
  it('summarises a full install with the visible signals', () => {
    const text = formatGlobalInstallSummary({
      skillsInstalled: 119,
      skillsSkipped: 0,
      mcpEnabled: ['playwright', 'context7'],
      mcpNeedsKey: ['github'],
      claudeMissing: false,
      commandInstalled: true,
    }).join('\n');

    expect(text).toContain('119 installed');
    expect(text).toContain('playwright, context7');
    expect(text).toContain('1 more need an API key');
    expect(text).toContain('/vybekiit');
  });

  it('explains when the claude command is missing', () => {
    const text = formatGlobalInstallSummary({
      skillsInstalled: 119,
      skillsSkipped: 0,
      mcpEnabled: [],
      mcpNeedsKey: [],
      claudeMissing: true,
      commandInstalled: true,
    }).join('\n');

    expect(text).toContain('claude` command was not found');
  });
});
