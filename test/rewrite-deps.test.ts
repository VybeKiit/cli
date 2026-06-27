import { describe, expect, it } from 'vitest';
import { rewriteWorkspaceDeps } from '../src/rewrite-deps';
import { isTemplateName } from '../src/scaffold';

describe('rewriteWorkspaceDeps', () => {
  it('pins @vybekiit workspace ranges to a caret npm version', () => {
    const result = rewriteWorkspaceDeps(
      { '@vybekiit/core': 'workspace:*', '@vybekiit/auth': 'workspace:^' },
      '0.1.0',
    );
    expect(result).toEqual({ '@vybekiit/core': '^0.1.0', '@vybekiit/auth': '^0.1.0' });
  });

  it('leaves third-party and non-workspace ranges untouched', () => {
    const result = rewriteWorkspaceDeps({ next: '^15.0.0', '@vybekiit/core': '^0.1.0' }, '0.2.0');
    expect(result).toEqual({ next: '^15.0.0', '@vybekiit/core': '^0.1.0' });
  });
});

describe('isTemplateName', () => {
  it('accepts known templates and rejects others', () => {
    expect(isTemplateName('web')).toBe(true);
    expect(isTemplateName('desktop')).toBe(false);
  });
});
