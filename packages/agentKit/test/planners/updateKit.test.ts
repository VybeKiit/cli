import { describe, expect, it } from 'vitest';
import { planKitUpdate } from '../../src/planners/update-kit';

describe('planKitUpdate', () => {
  it('flags packages with a strictly newer published version', () => {
    const result = planKitUpdate(
      { '@vybekiit/core': '0.1.0', '@vybekiit/auth': '0.2.0' },
      { '@vybekiit/core': '0.2.0', '@vybekiit/auth': '0.5.1' },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.upToDate).toBe(false);
    expect(result.value.updates).toEqual([
      { name: '@vybekiit/core', from: '0.1.0', to: '0.2.0' },
      { name: '@vybekiit/auth', from: '0.2.0', to: '0.5.1' },
    ]);
  });

  it('reports up to date when installed equals latest', () => {
    const result = planKitUpdate({ '@vybekiit/core': '1.0.0' }, { '@vybekiit/core': '1.0.0' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.upToDate).toBe(true);
    expect(result.value.updates).toEqual([]);
  });

  it('never downgrades when installed is newer than latest', () => {
    const result = planKitUpdate({ '@vybekiit/core': '2.0.0' }, { '@vybekiit/core': '1.9.9' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.upToDate).toBe(true);
  });

  it('skips packages absent from the latest map', () => {
    const result = planKitUpdate({ '@vybekiit/core': '0.1.0' }, {});
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.updates).toEqual([]);
  });

  it('strips a leading caret/tilde before comparing', () => {
    const result = planKitUpdate({ '@vybekiit/core': '^0.1.0' }, { '@vybekiit/core': '~0.1.0' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.upToDate).toBe(true);
  });

  it('fails with a translatable code on a malformed version', () => {
    const result = planKitUpdate(
      { '@vybekiit/core': 'not-a-version' },
      { '@vybekiit/core': '0.2.0' },
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('malformed_version');
  });
});
