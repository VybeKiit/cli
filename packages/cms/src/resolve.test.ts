import { it } from '@effect/vitest';
import { createCmsFromEnv, resolveCmsService } from '@vybekiit/cms/resolve';
import { Effect } from 'effect';
import { describe, expect } from 'vitest';

describe('resolveCmsService', () => {
  it.effect('resolves the mdx CMS service by default', () =>
    Effect.gen(function* () {
      const cms = yield* resolveCmsService({ CMS_PROVIDER: 'mdx', CMS_CONTENT_DIR: 'content' });
      expect(cms.name).toBe('mdx');
    }),
  );

  it.effect('fails loud for invalid CMS provider config', () =>
    Effect.gen(function* () {
      const error = yield* Effect.flip(resolveCmsService({ CMS_PROVIDER: 'remote' }));
      expect(error.code).toBe('CMS_CONFIG_INVALID');
      expect(error.message).toContain('CMS_PROVIDER');
    }),
  );
});

describe('legacy cms resolver', () => {
  it('keeps the deprecated Promise provider adapter working', async () => {
    const cms = createCmsFromEnv({ CMS_PROVIDER: 'local' });

    await expect(cms.listPages()).resolves.toEqual([]);
    expect(cms.name).toBe('local');
  });
});
