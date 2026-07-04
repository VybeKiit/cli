import { describe, expect, it } from 'vitest';
import { verifyMobilePublishReadiness } from '../src/doctor/mobilePublishReadiness';

describe('verifyMobilePublishReadiness', () => {
  it('passes on macOS when Xcode and Apple signing identity are present', () => {
    const report = verifyMobilePublishReadiness(
      'darwin',
      {},
      {
        succeeds: (command, args) => command === 'xcodebuild' && args[0] === '-version',
        output: (command) =>
          command === 'xcodebuild'
            ? 'Xcode 16.4\nBuild version 16F6'
            : '1) ABCD "Apple Development: Demo (TEAM123)"',
      },
    );
    expect(report.ok).toBe(true);
    expect(report.lines.some((line) => line.includes('✓ Xcode'))).toBe(true);
    expect(report.lines.some((line) => line.includes('✓ Apple Developer'))).toBe(true);
    expect(report.lines.some((line) => line.includes('Google Play Console'))).toBe(true);
  });

  it('fails on macOS when Xcode is missing', () => {
    const report = verifyMobilePublishReadiness(
      'darwin',
      {},
      {
        succeeds: () => false,
        output: () => '',
      },
    );
    expect(report.ok).toBe(false);
    expect(report.lines.some((line) => line.includes('✗ Xcode'))).toBe(true);
  });

  it('hints Apple Developer enrollment when no signing identity is found', () => {
    const report = verifyMobilePublishReadiness(
      'darwin',
      {},
      {
        succeeds: (command) => command === 'xcodebuild',
        output: (command) => (command === 'xcodebuild' ? 'Xcode 16.4' : ''),
      },
    );
    expect(report.lines.some((line) => line.includes('Apple Developer Program'))).toBe(true);
  });

  it('recognizes Google Play credential env hints', () => {
    const report = verifyMobilePublishReadiness(
      'linux',
      { GOOGLE_SERVICE_ACCOUNT_JSON: '/secrets/play.json' },
      { succeeds: () => false, output: () => '' },
    );
    expect(report.ok).toBe(true);
    expect(report.lines.some((line) => line.includes('✓ Google Play'))).toBe(true);
    expect(report.lines.some((line) => line.includes('macOS with the latest stable Xcode'))).toBe(
      true,
    );
  });
});
