import { describe, expect, it, vi } from 'vitest';
import { formatGlobalInstallSummary, runGlobalInstall } from '../../src/global/runGlobalInstall';

describe('formatGlobalInstallSummary', () => {
  it('summarises a full first install with the visible signals', () => {
    const text = formatGlobalInstallSummary({
      skillsInstalled: 119,
      skillsSkipped: 0,
      mcpEnabled: ['playwright', 'context7'],
      mcpRefreshed: [],
      mcpNeedsKey: ['github'],
      claudeMissing: false,
      commandInstalled: true,
      version: '0.6.2',
      previousVersion: null,
    }).join('\n');

    expect(text).toContain('0.6.2 is now set up');
    expect(text).toContain('119 installed');
    expect(text).toContain('playwright, context7');
    expect(text).toContain('1 more need an API key');
    expect(text).toContain('/vybekiit');
    expect(text).toContain('vybekiit@latest update');
  });

  it('calls out a version bump when re-running after a newer CLI', () => {
    const text = formatGlobalInstallSummary({
      skillsInstalled: 119,
      skillsSkipped: 0,
      mcpEnabled: [],
      mcpRefreshed: ['playwright', 'context7'],
      mcpNeedsKey: [],
      claudeMissing: false,
      commandInstalled: true,
      version: '0.6.2',
      previousVersion: '0.6.1',
    }).join('\n');

    expect(text).toContain('updated 0.6.1 → 0.6.2');
    expect(text).toContain('refreshed: playwright, context7');
  });

  it('explains when the claude command is missing', () => {
    const text = formatGlobalInstallSummary({
      skillsInstalled: 119,
      skillsSkipped: 0,
      mcpEnabled: [],
      mcpRefreshed: [],
      mcpNeedsKey: [],
      claudeMissing: true,
      commandInstalled: true,
      version: '0.6.1',
      previousVersion: null,
    }).join('\n');

    expect(text).toContain('claude` command was not found');
  });
});

describe('runGlobalInstall buyer gate', () => {
  it('consults the gate and blocks with exit 1 when not entitled', async () => {
    // Suppress the buyer-block message so it doesn't spew into the test runner's stderr.
    const quiet = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
    const gate = vi.fn(async () => ({
      entitled: false,
      reason: 'no-access' as const,
      login: 'stranger',
    }));

    // A non-entitled gate must short-circuit before any skills/MCP/awareness work runs.
    const code = await runGlobalInstall(['--yes'], gate);
    quiet.mockRestore();

    expect(gate).toHaveBeenCalledOnce();
    expect(code).toBe(1);
  });
});
