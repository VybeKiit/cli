import { cmsConfigSchema, mdxCmsConfigSchema, parseEnv, type EnvSource } from '@vybekiit/core';
import { createMdxCms } from './providers/mdx';
import type { CmsProvider } from './types';

export function resolveCmsProvider(env: EnvSource = process.env): CmsProvider {
  const { CMS_PROVIDER } = parseEnv(cmsConfigSchema, env);
  if (CMS_PROVIDER === 'local') {
    return createMdxCms(parseEnv(mdxCmsConfigSchema, env));
  }
  return createMdxCms(parseEnv(mdxCmsConfigSchema, env));
}
