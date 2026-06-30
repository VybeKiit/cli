import { describe, expect, it } from 'vitest';
import {
  formatRailwayStackReport,
  isRailwayStackActive,
  runRailwayAgentSetup,
  verifyCoupledStack,
} from '../src/doctor/railway-agent-setup';

describe('railway agent setup', () => {
  it('detects active railway stack from hosting or data', () => {
    expect(isRailwayStackActive({ HOSTING_PROVIDER: 'railway' })).toBe(true);
    expect(isRailwayStackActive({ DATA_PROVIDER: 'railway' })).toBe(true);
    expect(isRailwayStackActive({ HOSTING_PROVIDER: 'cloudflare' })).toBe(false);
  });

  it('warns when coupled stack is misconfigured', () => {
    expect(verifyCoupledStack({ HOSTING_PROVIDER: 'railway', DATA_PROVIDER: 'supabase' })).toMatch(
      /DATA_PROVIDER=railway/,
    );
    expect(
      verifyCoupledStack({ DATA_PROVIDER: 'railway', HOSTING_PROVIDER: 'cloudflare' }),
    ).toMatch(/HOSTING_PROVIDER=railway/);
    expect(
      verifyCoupledStack({ HOSTING_PROVIDER: 'railway', DATA_PROVIDER: 'railway' }),
    ).toBeNull();
  });

  it('skips agent setup when railway is not installed', () => {
    const result = runRailwayAgentSetup(false, null);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/install/);
  });

  it('formats stack report lines when railway is active', () => {
    const lines = formatRailwayStackReport(
      { HOSTING_PROVIDER: 'railway', DATA_PROVIDER: 'supabase' },
      { ok: false, message: '→ setup skipped' },
    );
    expect(lines.length).toBe(2);
  });
});
