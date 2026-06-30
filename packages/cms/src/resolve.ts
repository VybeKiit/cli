import { cmsConfigSchema, mdxCmsConfigSchema, parseEnv, type EnvSource } from '@vybekiit/core';
import { createMdxCms } from './providers/mdx';
import type { CmsProvider } from './types';

/** CMS resolves to MDX local provider — CMS_PROVIDER validated but only one adapter ships. */
export function resolveCmsProvider(env: EnvSource = process.env): CmsProvider {
  parseEnv(cmsConfigSchema, env);
  return createMdxCms(parseEnv(mdxCmsConfigSchema, env));
}
