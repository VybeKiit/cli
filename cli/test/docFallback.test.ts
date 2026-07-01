import { describe, expect, it } from 'vitest';
import { runDocFallback } from '../src/commands/docFallback';

describe('runDocFallback', () => {
  it('returns JSON plan for twilio', () => {
    const { json, exitCode } = runDocFallback(['twilio']);
    expect(exitCode).toBe(0);
    const plan = JSON.parse(json) as { docsUrl: string; found: boolean };
    expect(plan.found).toBe(true);
    expect(plan.docsUrl).toContain('twilio.com');
  });

  it('returns JSON plan for sentry and posthog', () => {
    for (const id of ['sentry', 'posthog'] as const) {
      const { json, exitCode } = runDocFallback([id]);
      expect(exitCode).toBe(0);
      const plan = JSON.parse(json) as { docsUrl: string; found: boolean; mcpDocsUrl?: string };
      expect(plan.found).toBe(true);
      expect(plan.mcpDocsUrl).toBeTruthy();
    }
  });

  it('exit 1 when tech id missing', () => {
    const { exitCode } = runDocFallback([]);
    expect(exitCode).toBe(1);
  });
});
