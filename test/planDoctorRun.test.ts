import { describe, expect, it } from 'vitest';
import { computeDoctorExitCode } from '../src/doctor/planDoctorRun';

describe('computeDoctorExitCode', () => {
  const allPass = {
    cloudReady: true,
    r2Ok: true,
    agentReady: true,
    skillsReady: true,
    projectHealthOk: true,
    globalClaudeOk: true,
  };

  it('returns 0 when every gate passes', () => {
    expect(computeDoctorExitCode(allPass)).toBe(0);
  });

  it('returns 1 when cloud tools missing', () => {
    expect(computeDoctorExitCode({ ...allPass, cloudReady: false })).toBe(1);
  });

  it('returns 1 when R2 provisioning failed', () => {
    expect(computeDoctorExitCode({ ...allPass, r2Ok: false })).toBe(1);
  });

  it('returns 1 when no agent runtime and not in Cursor', () => {
    expect(computeDoctorExitCode({ ...allPass, agentReady: false })).toBe(1);
  });

  it('returns 1 when skills CLI missing', () => {
    expect(computeDoctorExitCode({ ...allPass, skillsReady: false })).toBe(1);
  });

  it('returns 1 when project health checks fail', () => {
    expect(computeDoctorExitCode({ ...allPass, projectHealthOk: false })).toBe(1);
  });

  it('returns 1 when mobile publish readiness fails on macOS', () => {
    expect(computeDoctorExitCode({ ...allPass, mobilePublishOk: false })).toBe(1);
  });

  it('returns 1 when Claude global skills are not installed', () => {
    expect(computeDoctorExitCode({ ...allPass, globalClaudeOk: false })).toBe(1);
  });

  it('passes when mobilePublishOk / globalClaudeOk are omitted', () => {
    const { globalClaudeOk: _g, ...withoutOptional } = allPass;
    expect(computeDoctorExitCode(withoutOptional)).toBe(0);
  });
});
