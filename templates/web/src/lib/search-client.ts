import { resolveSearchProvider } from '@vybekiit/search';

/** Search wire point — skill: add-search */
export function getSearch() {
  return resolveSearchProvider();
}
