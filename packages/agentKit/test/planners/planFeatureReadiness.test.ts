import { describe, expect, it } from 'vitest';
import {
  planFeatureReadiness,
  resolveTemplateTopology,
} from '../../src/planners/planFeatureReadiness';

describe('planFeatureReadiness', () => {
  it('web is always ready', () => {
    const plan = planFeatureReadiness({
      template: 'web',
      feature: 'sign-in',
      hasBackend: false,
      hasWeb: true,
    });
    expect(plan.ready).toBe(true);
  });

  it('orchestrates backend scaffold for extension without backend or web', () => {
    const plan = planFeatureReadiness({
      template: 'extension',
      feature: 'sign-in',
      hasBackend: false,
      hasWeb: false,
    });
    expect(plan.ready).toBe(false);
    expect(plan.orchestrate?.[0]?.action).toBe('scaffold-backend');
    expect(plan.orchestrate?.[0]?.cli).toContain('scaffold backend');
  });

  it('points mobile at web when web exists but no backend', () => {
    const plan = planFeatureReadiness({
      template: 'mobile',
      feature: 'sign-in',
      hasBackend: false,
      hasWeb: true,
    });
    expect(plan.ready).toBe(false);
    expect(plan.orchestrate?.[0]?.action).toBe('set-env');
    expect(plan.orchestrate?.[0]?.envKey).toBe('EXPO_PUBLIC_APP_URL');
  });
});

describe('resolveTemplateTopology', () => {
  it('resolves spa topology for client-only', () => {
    expect(
      resolveTemplateTopology({
        template: 'spa',
        hasBackend: false,
        hasWeb: false,
      }),
    ).toBe('client-only');
  });
});
