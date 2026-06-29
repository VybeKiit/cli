import { resolveAnalyticsProvider } from '@vybekiit/analytics';

/** Server/client wire point for visitor stats — skill: add-analytics */
export function getAnalytics() {
  return resolveAnalyticsProvider();
}
