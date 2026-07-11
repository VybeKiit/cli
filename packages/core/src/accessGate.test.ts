import { describe, expect, it } from 'vitest';
import {
  DEFAULT_GATE_ORG,
  DEFAULT_GATE_REPOS,
  normalizeGateRepos,
  readGateIdentity,
} from './accessGate';

describe('normalizeGateRepos', () => {
  it('returns defaults when empty', () => {
    expect(normalizeGateRepos(undefined)).toEqual([...DEFAULT_GATE_REPOS]);
    expect(normalizeGateRepos([])).toEqual([...DEFAULT_GATE_REPOS]);
  });

  it('keeps a non-empty list', () => {
    expect(normalizeGateRepos(['kit'])).toEqual(['kit']);
  });
});

describe('readGateIdentity', () => {
  it('prefers GITHUB_GATE_* then VYBEKIIT_GATE_* then defaults', () => {
    expect(readGateIdentity({})).toEqual({
      org: DEFAULT_GATE_ORG,
      repos: [...DEFAULT_GATE_REPOS],
    });
    expect(
      readGateIdentity({
        VYBEKIIT_GATE_ORG: 'Other',
        VYBEKIIT_GATE_REPOS: 'kit,web',
      }),
    ).toEqual({ org: 'Other', repos: ['kit', 'web'] });
    expect(
      readGateIdentity({
        GITHUB_GATE_ORG: 'Primary',
        VYBEKIIT_GATE_ORG: 'Other',
      }),
    ).toEqual({ org: 'Primary', repos: [...DEFAULT_GATE_REPOS] });
  });
});
