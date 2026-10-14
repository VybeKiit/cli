import { describe, expect, it } from 'vitest';
import {
  AGENT_TOOLS,
  formatReport,
  isAgentRuntimeReady,
  isSignedIn,
  isSkillsCliReady,
  isToolchainReady,
  meetsMinimumVersion,
  mergeAgentAndProviderTools,
  planInstall,
  selectToolchain,
  type ToolReport,
} from '../../src/doctor/toolchain';
import { CLAUDE, GH, WRANGLER } from '../../src/doctor/toolDeclarations';

describe('mergeAgentAndProviderTools', () => {
  it('prepends agent tools before provider tools', () => {
    const names = mergeAgentAndProviderTools(selectToolchain({})).map((tool) => tool.name);

    expect(names.slice(0, 3)).toEqual(['claude', 'codex', 'skills']);
    expect(names).toContain('gh');
    expect(names).toContain('wrangler');
  });

  it('exports the expected agent tools', () => {
    expect(AGENT_TOOLS.map((tool) => tool.name)).toEqual(['claude', 'codex', 'skills']);
  });
});

describe('agent runtime readiness', () => {
  it('is true when claude or codex is installed', () => {
    expect(
      isAgentRuntimeReady([
        { tool: 'claude', purpose: '', installed: true, authed: null },
        { tool: 'codex', purpose: '', installed: false, authed: null },
      ]),
    ).toBe(true);
    expect(
      isAgentRuntimeReady([
        { tool: 'claude', purpose: '', installed: false, authed: null },
        { tool: 'codex', purpose: '', installed: true, authed: null },
      ]),
    ).toBe(true);
    expect(
      isAgentRuntimeReady([
        { tool: 'claude', purpose: '', installed: false, authed: null },
        { tool: 'codex', purpose: '', installed: false, authed: null },
      ]),
    ).toBe(false);
  });

  it('is ready for skills only when the skills CLI is installed', () => {
    expect(isSkillsCliReady([{ tool: 'skills', purpose: '', installed: true, authed: null }])).toBe(
      true,
    );
    expect(
      isSkillsCliReady([{ tool: 'skills', purpose: '', installed: false, authed: null }]),
    ).toBe(false);
  });
});

describe('planInstall', () => {
  it('returns install actions only for missing tools in toolchain order', () => {
    const actions = planInstall('darwin', [
      { tool: 'wrangler', present: true },
      { tool: 'supabase', present: false },
    ]);

    expect(actions).toEqual([
      {
        tool: 'supabase',
        kind: 'release',
        repository: 'supabase/cli',
        assetNames: {
          x64: 'supabase_darwin_amd64.tar.gz',
          arm64: 'supabase_darwin_arm64.tar.gz',
        },
      },
    ]);
  });

  it('plans nothing when every tool is present', () => {
    const actions = planInstall('linux', [
      { tool: 'wrangler', present: true },
      { tool: 'supabase', present: true },
    ]);

    expect(actions).toEqual([]);
  });

  it('uses the per-OS install channel', () => {
    const [wrangler] = planInstall('win32', [
      { tool: 'wrangler', present: false },
      { tool: 'supabase', present: true },
    ]);

    expect(wrangler).toEqual({ tool: 'wrangler', kind: 'npm', packageName: 'wrangler' });
  });
});

describe('meetsMinimumVersion', () => {
  it('compares each version part as a number', () => {
    expect(meetsMinimumVersion('2.1.281 (Claude Code)', '2.1.281')).toBe(true);
    expect(meetsMinimumVersion('2.1.299 (Claude Code)', '2.1.281')).toBe(true);
    expect(meetsMinimumVersion('2.1.99 (Claude Code)', '2.1.281')).toBe(false);
    expect(meetsMinimumVersion('10.0.0', '9.9.9')).toBe(true);
  });

  it('accepts any version when the tool has no minimum', () => {
    expect(meetsMinimumVersion('gh version 2.0.0', undefined)).toBe(true);
  });

  it('rejects output with no version number', () => {
    expect(meetsMinimumVersion('command not found', '2.1.281')).toBe(false);
  });
});

describe('isSignedIn', () => {
  const wranglerAuth = WRANGLER.auth;
  const ghAuth = GH.auth;

  it('treats the signed-out wrangler whoami text as signed out even when it exits 0', () => {
    expect(wranglerAuth).toBeDefined();
    const signedOut = {
      code: 0,
      stdout: 'You are not authenticated. Please run `wrangler login`.',
      stderr: '',
    };
    const signedInProbe = { code: 0, stdout: 'You are logged in with an OAuth Token', stderr: '' };
    expect(wranglerAuth && isSignedIn(wranglerAuth, signedOut)).toBe(false);
    expect(wranglerAuth && isSignedIn(wranglerAuth, signedInProbe)).toBe(true);
  });

  it('uses the exit code for tools without signed-out text', () => {
    expect(ghAuth).toBeDefined();
    expect(ghAuth && isSignedIn(ghAuth, { code: 1, stdout: '', stderr: '' })).toBe(false);
    expect(ghAuth && isSignedIn(ghAuth, { code: 0, stdout: '', stderr: '' })).toBe(true);
  });
});

describe('Claude Code install', () => {
  const missingClaude = [{ tool: 'claude', present: false }];

  it('requires the version that supports the onboarding flow', () => {
    expect(CLAUDE.minimumVersion).toBe('2.1.281');
  });

  it('uses the official installer script on macOS and Linux', () => {
    const claudeInstalls = (['darwin', 'linux'] as const).flatMap((platform) =>
      planInstall(platform, missingClaude, [CLAUDE]),
    );
    const officialScript = { tool: 'claude', kind: 'script', url: 'https://claude.ai/install.sh' };
    expect(claudeInstalls).toEqual([officialScript, officialScript]);
  });

  it('uses the official PowerShell installer on Windows', () => {
    const [claudeInstall] = planInstall('win32', missingClaude, [CLAUDE]);
    expect(claudeInstall).toMatchObject({ kind: 'command', command: 'powershell' });
    expect(claudeInstall?.kind === 'command' && claudeInstall.args.join(' ')).toContain(
      'irm https://claude.ai/install.ps1 | iex',
    );
  });
});

describe('GitHub CLI install', () => {
  it('downloads the official release for each OS, so no admin rights are needed', () => {
    const missingGh = [{ tool: 'gh', present: false }];
    const releaseRepositories = (['darwin', 'win32', 'linux'] as const).map((platform) =>
      planInstall(platform, missingGh, [GH]).map((action) =>
        action.kind === 'release' ? action.repository : action.kind,
      ),
    );
    expect(releaseRepositories).toEqual([['cli/cli'], ['cli/cli'], ['cli/cli']]);
  });
});

describe('formatReport', () => {
  it('renders ready, sign-in, and failed states in plain language', () => {
    const reports: ToolReport[] = [
      { tool: 'wrangler', purpose: 'put your app online', installed: true, authed: true },
      {
        tool: 'supabase',
        purpose: 'create and manage your database',
        installed: true,
        authed: false,
        loginHint: 'supabase login',
      },
      {
        tool: 'demo',
        purpose: 'do a thing',
        installed: false,
        authed: null,
        missingRequirement: 'Homebrew',
      },
    ];

    const [ready, needsLogin, failed] = formatReport(reports);

    expect(ready).toContain('✓ wrangler');
    expect(needsLogin).toContain('supabase login');
    expect(failed).toContain('Homebrew');
  });
});

describe('isToolchainReady', () => {
  it('is true only when all tools are installed and none is unsigned', () => {
    expect(
      isToolchainReady([
        { tool: 'a', purpose: '', installed: true, authed: true },
        { tool: 'b', purpose: '', installed: true, authed: null },
      ]),
    ).toBe(true);
    expect(isToolchainReady([{ tool: 'a', purpose: '', installed: true, authed: false }])).toBe(
      false,
    );
    expect(isToolchainReady([{ tool: 'a', purpose: '', installed: false, authed: null }])).toBe(
      false,
    );
  });
});
