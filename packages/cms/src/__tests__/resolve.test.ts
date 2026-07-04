import { resolveCmsProvider } from '@vybekiit/cms/resolve';
import { describe, expect, it } from 'vitest';

describe('resolveCmsProvider', () => {
  it('returns mdx provider by default', () => {
    const cms = resolveCmsProvider({ CMS_PROVIDER: 'mdx', CMS_CONTENT_DIR: 'content' });
    expect(cms.name).toBe('mdx');
  });
});
