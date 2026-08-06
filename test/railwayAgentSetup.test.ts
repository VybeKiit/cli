import { describe, expect, it } from 'vitest';
import {
  formatRailwayStackReport,
  isRailwayStackActive,
  runRailwayAgentSetup,
  verifyCoupledStack,
} from '../src/doctor/railwayAgentSetup';

const DATA_PROVIDER_WARNING = /DATA_PROVIDER=railway/;
const HOSTING_PROVIDER_WARNING = /HOSTING_PROVIDER=railway/;
const INSTALL_WARNING = /install/;

describe('railway agent setup', () => {
  it('detects active railway stack from hosting or data', () => {
    expect(isRailwayStackActive({ HOSTING_PROVIDER: 'railway' })).toBe(true);
    expect(isRailwayStackActive({ DATA_PROVIDER: 'railway' })).toBe(true);
    expect(isRailwayStackActive({ HOSTING_PROVIDER: 'cloudflare' })).toBe(false);
  });

  it('warns when coupled stack is misconfigured', () => {
    expect(verifyCoupledStack({ HOSTING_PROVIDER: 'railway', DATA_PROVIDER: 'supabase' })).toMatch(
      DATA_PROVIDER_WARNING,
    );
    expect(
      verifyCoupledStack({ DATA_PROVIDER: 'railway', HOSTING_PROVIDER: 'cloudflare' }),
    ).toMatch(HOSTING_PROVIDER_WARNING);
    expect(
      verifyCoupledStack({ HOSTING_PROVIDER: 'railway', DATA_PROVIDER: 'railway' }),
    ).toBeNull();
  });

  it('skips agent setup when railway is not installed', () => {
    const agentSetup = runRailwayAgentSetup(false, null);
    expect(agentSetup.ok).toBe(false);
    expect(agentSetup.message).toMatch(INSTALL_WARNING);
  });

  it('formats stack report lines when railway is active', () => {
    const lines = formatRailwayStackReport(
      { HOSTING_PROVIDER: 'railway', DATA_PROVIDER: 'supabase' },
      { ok: false, message: '→ setup skipped' },
    );
    expect(lines.length).toBe(2);
  });
});
