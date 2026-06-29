import { describe, expect, it } from 'vitest';
import {
  AGENT_TOOLS,
  formatReport,
  isAgentRuntimeReady,
  isSkillsCliReady,
  isToolchainReady,
  mergeAgentAndProviderTools,
  planInstall,
  selectToolchain,
  type ToolReport,
} from '../src/doctor/toolchain';
import { expectedSkillNames, verifyPlatformSkills } from '../src/doctor/platform-skills';
import { verifyProjectHealth } from '../src/doctor/project-health';

describe('selectToolchain', () => {
  it('returns [gh, wrangler, supabase] for the defaults (empty env)', () => {
    expect(selectToolchain({}).map((tool) => tool.name)).toEqual(['gh', 'wrangler', 'supabase']);
  });

  it('matches the exported default TOOLCHAIN for explicit defaults', () => {
    const names = selectToolchain({
      HOSTING_PROVIDER: 'cloudflare',
      DATA_PROVIDER: 'supabase',
    }).map((tool) => tool.name);
    expect(names).toEqual(['gh', 'wrangler', 'supabase']);
  });

  it('always leads with gh, the base tool, regardless of provider', () => {
    expect(selectToolchain({}).map((tool) => tool.name)[0]).toBe('gh');
    expect(
      selectToolchain({ HOSTING_PROVIDER: 'aws', DATA_PROVIDER: 'aws' }).map(
        (tool) => tool.name,
      )[0],
    ).toBe('gh');
    expect(selectToolchain({}, { mobile: true }).map((tool) => tool.name)[0]).toBe('gh');
  });

  it('the gh base tool probes sign-in with `gh auth status` / `gh auth login --web`', () => {
    const gh = selectToolchain({}).find((tool) => tool.name === 'gh');
    expect(gh?.auth?.command).toBe('gh');
    expect(gh?.auth?.args).toEqual(['auth', 'status']);
    expect(gh?.auth?.loginHint).toBe('gh auth login --web');
  });

  it('includes the Atlas CLI when the Mongo data adapter is active', () => {
    const names = selectToolchain({ DATA_PROVIDER: 'mongodb' }).map((tool) => tool.name);
    expect(names).toEqual(['gh', 'wrangler', 'atlas']);
  });

  it('includes the AWS CLI (once) when any single AWS adapter is set', () => {
    expect(selectToolchain({ STORAGE_PROVIDER: 's3' }).map((tool) => tool.name)).toEqual([
      'gh',
      'wrangler',
      'supabase',
      'aws',
    ]);
    expect(selectToolchain({ EMAIL_PROVIDER: 'ses' }).map((tool) => tool.name)).toEqual([
      'gh',
      'wrangler',
      'supabase',
      'aws',
    ]);
    expect(selectToolchain({ AUTH_PROVIDER: 'cognito' }).map((tool) => tool.name)).toEqual([
      'gh',
      'wrangler',
      'supabase',
      'aws',
    ]);
  });

  it('uses the Vercel CLI when the vercel hosting adapter is active', () => {
    const names = selectToolchain({ HOSTING_PROVIDER: 'vercel' }).map((tool) => tool.name);
    expect(names).toEqual(['gh', 'vercel', 'supabase']);
  });

  it('uses the AWS CLI for hosting and dedupes when data is also AWS', () => {
    const allAws = selectToolchain({ HOSTING_PROVIDER: 'aws', DATA_PROVIDER: 'aws' }).map(
      (tool) => tool.name,
    );
    expect(allAws).toEqual(['gh', 'aws']);
  });

  it('handles a mixed combo: AWS hosting + Mongo data', () => {
    const names = selectToolchain({ HOSTING_PROVIDER: 'aws', DATA_PROVIDER: 'mongodb' }).map(
      (tool) => tool.name,
    );
    expect(names).toEqual(['gh', 'aws', 'atlas']);
  });

  it('appends the mobile tools (eas, launch) on top of the env tools when mobile', () => {
    const names = selectToolchain({}, { mobile: true }).map((tool) => tool.name);
    expect(names).toEqual(['gh', 'wrangler', 'supabase', 'eas', 'launch']);
  });

  it('appends the mobile tools after AWS adapters, deduped once each', () => {
    const names = selectToolchain(
      { HOSTING_PROVIDER: 'aws', DATA_PROVIDER: 'aws' },
      { mobile: true },
    ).map((tool) => tool.name);
    expect(names).toEqual(['gh', 'aws', 'eas', 'launch']);
    expect(names.filter((name) => name === 'eas')).toHaveLength(1);
    expect(names.filter((name) => name === 'launch')).toHaveLength(1);
  });

  it('leaves the web default identical when mobile is false or omitted', () => {
    expect(selectToolchain({}, { mobile: false }).map((tool) => tool.name)).toEqual([
      'gh',
      'wrangler',
      'supabase',
    ]);
    expect(selectToolchain({}).map((tool) => tool.name)).toEqual(['gh', 'wrangler', 'supabase']);
  });

  it('the launch tool needs no sign-in probe (no auth)', () => {
    const launch = selectToolchain({}, { mobile: true }).find((tool) => tool.name === 'launch');
    expect(launch?.auth).toBeUndefined();
  });

  it('the eas tool probes sign-in with `eas whoami` / `eas login`', () => {
    const eas = selectToolchain({}, { mobile: true }).find((tool) => tool.name === 'eas');
    expect(eas?.auth?.command).toBe('eas');
    expect(eas?.auth?.loginHint).toBe('eas login');
  });

  it('is NOT selected by default — the web default stays [gh, wrangler, supabase]', () => {
    expect(selectToolchain({}).map((tool) => tool.name)).not.toContain('gcloud');
  });

  it('includes gcloud when the app uses sign in with Google (wantsGoogleAuth flag)', () => {
    const names = selectToolchain({}, { wantsGoogleAuth: true }).map((tool) => tool.name);
    expect(names).toEqual(['gh', 'wrangler', 'supabase', 'gcloud']);
  });

  it('includes gcloud when a GOOGLE_OAUTH_CLIENT_ID is present in the env', () => {
    const names = selectToolchain({ GOOGLE_OAUTH_CLIENT_ID: 'abc.apps.googleusercontent.com' }).map(
      (tool) => tool.name,
    );
    expect(names).toEqual(['gh', 'wrangler', 'supabase', 'gcloud']);
  });

  it('adds gcloud after AWS adapters and before the mobile tools, deduped once', () => {
    const names = selectToolchain(
      { STORAGE_PROVIDER: 's3', GOOGLE_OAUTH_CLIENT_ID: 'x' },
      { wantsGoogleAuth: true, mobile: true },
    ).map((tool) => tool.name);
    expect(names).toEqual(['gh', 'wrangler', 'supabase', 'aws', 'gcloud', 'eas', 'launch']);
    expect(names.filter((name) => name === 'gcloud')).toHaveLength(1);
  });

  it('the gcloud tool probes sign-in with `gcloud auth list` / `gcloud auth login`', () => {
    const gcloud = selectToolchain({}, { wantsGoogleAuth: true }).find(
      (tool) => tool.name === 'gcloud',
    );
    expect(gcloud?.auth?.command).toBe('gcloud');
    expect(gcloud?.auth?.args).toEqual(['auth', 'list']);
    expect(gcloud?.auth?.loginHint).toBe('gcloud auth login');
  });

  it('resolves a non-empty gcloud install command on every supported platform', () => {
    const gcloud = selectToolchain({}, { wantsGoogleAuth: true }).find(
      (tool) => tool.name === 'gcloud',
    );
    const presence = [{ tool: 'gcloud', present: false }];
    for (const platform of ['darwin', 'win32', 'linux'] as const) {
      const [action] = planInstall(platform, presence, gcloud ? [gcloud] : []);
      expect(action?.command).toBeTruthy();
      expect(action?.args.length).toBeGreaterThan(0);
    }
  });
});

describe('mergeAgentAndProviderTools', () => {
  it('prepends agent tools before provider tools', () => {
    const names = mergeAgentAndProviderTools(selectToolchain({})).map((t) => t.name);
    expect(names.slice(0, 3)).toEqual(['claude', 'codex', 'skills']);
    expect(names).toContain('gh');
    expect(names).toContain('wrangler');
  });

  it('AGENT_TOOLS exports claude, codex, skills', () => {
    expect(AGENT_TOOLS.map((t) => t.name)).toEqual(['claude', 'codex', 'skills']);
  });
});

describe('isAgentRuntimeReady', () => {
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
});

describe('isSkillsCliReady', () => {
  it('is true only when skills CLI is installed', () => {
    expect(isSkillsCliReady([{ tool: 'skills', purpose: '', installed: true, authed: null }])).toBe(
      true,
    );
    expect(
      isSkillsCliReady([{ tool: 'skills', purpose: '', installed: false, authed: null }]),
    ).toBe(false);
  });
});

describe('verifyPlatformSkills', () => {
  it('returns ok when no manifest exists', () => {
    expect(verifyPlatformSkills('/nonexistent-path-xyz')).toEqual({
      ok: true,
      missing: [],
      template: null,
    });
  });

  it('expectedSkillNames flattens manifest sources', () => {
    expect(
      expectedSkillNames({
        sources: [{ repo: 'vercel-labs/agent-skills', skills: ['a', 'b'] }],
      }),
    ).toEqual(['a', 'b']);
  });
});

describe('planInstall', () => {
  it('returns install actions only for missing tools, in toolchain order', () => {
    const actions = planInstall('darwin', [
      { tool: 'wrangler', present: true },
      { tool: 'supabase', present: false },
    ]);
    expect(actions).toEqual([
      {
        tool: 'supabase',
        command: 'brew',
        args: ['install', 'supabase/tap/supabase'],
        requires: 'Homebrew',
      },
    ]);
  });

  it('plans nothing when every tool is present (idempotent re-run)', () => {
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
    expect(wrangler?.command).toBe('npm');
  });
});

describe('formatReport', () => {
  it('renders ready / needs-sign-in / failed states in plain language', () => {
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

describe('verifyProjectHealth', () => {
  it('passes for web template with .cursorignore and .gitignore', () => {
    const report = verifyProjectHealth(new URL('../../templates/web', import.meta.url).pathname);
    expect(report.ok).toBe(true);
    expect(report.lines.some((line) => line.startsWith('✓'))).toBe(true);
  });
});
