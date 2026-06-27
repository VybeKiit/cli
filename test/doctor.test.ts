import { describe, expect, it } from 'vitest';
import {
  type ToolReport,
  formatReport,
  isToolchainReady,
  planInstall,
} from '../src/doctor/toolchain';

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
