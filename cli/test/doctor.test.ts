import { describe, expect, it } from 'vitest';
import {
  type ToolReport,
  formatReport,
  isToolchainReady,
  planInstall,
  selectToolchain,
} from '../src/doctor/toolchain';

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
