import { describe, expect, it } from 'vitest';
import { resolveCmsProvider } from '../resolve';

describe('resolveCmsProvider', () => {
  it('returns mdx provider by default', () => {
    const cms = resolveCmsProvider({ CMS_PROVIDER: 'mdx', CMS_CONTENT_DIR: 'content' });
    expect(cms.name).toBe('mdx');
  });
});
