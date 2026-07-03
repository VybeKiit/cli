import { cmsConfigSchema, mdxCmsConfigSchema, parseEnv, type EnvSource } from '@vybekiit/core';
import { createMdxCms } from './providers/mdx';
import type { CmsProvider } from './types';
import process from 'node:process';

/** Build the MDX blog-page module from env — single adapter until #2 ships. */
export function createCmsFromEnv(env: EnvSource = process.env): CmsProvider {
  parseEnv(cmsConfigSchema, env);
  return createMdxCms(parseEnv(mdxCmsConfigSchema, env));
}

/** @deprecated Use {@link createCmsFromEnv} — kept for existing template imports. */
export const resolveCmsProvider = createCmsFromEnv;
