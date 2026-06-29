import { resolveComplianceProvider } from '@vybekiit/compliance';

/** Cookie consent wire point */
export function getCompliance() {
  return resolveComplianceProvider();
}
