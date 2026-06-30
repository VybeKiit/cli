import { createCmsFromEnv } from '@vybekiit/cms';

/** Blog/content wire point — skill: add-blog */
export function getCms() {
  return createCmsFromEnv();
}
