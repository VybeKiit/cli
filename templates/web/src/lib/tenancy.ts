import { resolveTenancyProvider } from '@vybekiit/tenancy';

/** Team workspace wire point — skill: add-teams */
export function getTenancy() {
  return resolveTenancyProvider();
}
