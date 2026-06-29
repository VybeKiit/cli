import { resolveCmsProvider } from '@vybekiit/cms';

/** Blog/content wire point — skill: add-blog */
export function getCms() {
  return resolveCmsProvider();
}
