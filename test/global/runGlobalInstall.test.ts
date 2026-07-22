import { describe, expect, it, vi } from 'vitest';
import { formatGlobalInstallSummary, runGlobalInstall } from '../../src/global/runGlobalInstall';

const baseSummary = {
  skillsInstalled: 119,
  skillsSkipped: 0,
  skippedSkillNames: [] as readonly string[],
  feedbackInstalled: true,
  skillSample: ['add-signin', 'go-live', 'onboarding', 'plan-my-idea', 'setup-payments'],
  skillsPath: '/Users/me/.claude/skills',
  mcpEnabled: ['playwright', 'context7'] as readonly string[],
  mcpRefreshed: [] as readonly string[],
  mcpNeedsKey: ['github'] as readonly string[],
  claudeMissing: false,
  commandInstalled: true,
  version: '0.6.2',
  previousVersion: null as string | null,
};

describe('formatGlobalInstallSummary', () => {
  it('summarises a full first install with the visible signals and skill smoke sample', () => {
    const text = formatGlobalInstallSummary(baseSummary).join('\n');

    expect(text).toContain('0.6.2 is now set up');
    expect(text).toContain('119 installed');
    expect(text).toContain('/Users/me/.claude/skills');
    expect(text).toContain('onboarding');
    expect(text).toContain('setup-payments');
    expect(text).toContain('playwright, context7');
    expect(text).toContain('1 more need an API key');
    expect(text).toContain('/vybekiit');
    expect(text).toContain('/feedback');
    expect(text).toContain('vybekiit@latest update');
  });

  it('does not advertise feedback when a user-owned collision was preserved', () => {
    const text = formatGlobalInstallSummary({
      ...baseSummary,
      feedbackInstalled: false,
      skillsSkipped: 1,
      skippedSkillNames: ['feedback'],
    }).join('\n');

    expect(text).toContain('kept your own same-named skills: feedback');
    expect(text).not.toContain('/feedback');
  });

  it('calls out a version bump when re-running after a newer CLI', () => {
    const text = formatGlobalInstallSummary({
      ...baseSummary,
      mcpEnabled: [],
      mcpRefreshed: ['playwright', 'context7'],
      mcpNeedsKey: [],
      previousVersion: '0.6.1',
    }).join('\n');

    expect(text).toContain('updated 0.6.1 → 0.6.2');
    expect(text).toContain('refreshed: playwright, context7');
  });

  it('explains when the claude command is missing', () => {
    const text = formatGlobalInstallSummary({
      ...baseSummary,
      mcpEnabled: [],
      mcpNeedsKey: [],
      claudeMissing: true,
      version: '0.6.1',
    }).join('\n');

    expect(text).toContain('claude` command was not found');
  });

  it('hard-fails messaging when zero skills landed', () => {
    const text = formatGlobalInstallSummary({
      ...baseSummary,
      skillsInstalled: 0,
      skillSample: [],
      mcpEnabled: [],
      mcpNeedsKey: [],
    }).join('\n');

    expect(text).toContain('0 installed');
    expect(text).toContain('No managed skills');
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
