import { describe, expect, it } from 'vitest';

import {
  LS_E2E_PREFIX,
  createE2eArtifacts,
  matchesE2ePrefix,
  probeProductName,
} from '../../dev/recorder/shared/probe/e2eNames';

describe('e2eNames', () => {
  it('creates four probe product name patterns with shared prefix', () => {
    const a = createE2eArtifacts();
    expect(a.runId).toBeTruthy();
    expect(probeProductName('single', a.runId)).toMatch(new RegExp(`^${LS_E2E_PREFIX}-single-`));
    expect(probeProductName('subscription', a.runId)).toMatch(
      new RegExp(`^${LS_E2E_PREFIX}-subscription-`),
    );
    expect(probeProductName('leadMagnet', a.runId)).toMatch(new RegExp(`^${LS_E2E_PREFIX}-lead-`));
    expect(probeProductName('payWhatYouWant', a.runId)).toMatch(
      new RegExp(`^${LS_E2E_PREFIX}-pwyw-`),
    );
  });

  it('matchesE2ePrefix detects probe artifacts', () => {
    expect(matchesE2ePrefix('vybekiit-probe-single-2026-06-29')).toBe(true);
    expect(matchesE2ePrefix('My Real Product')).toBe(false);
  });
});
