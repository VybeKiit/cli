import { resolveAnalyticsProvider } from '@/vybekiit/analytics';
import { resolveAiProvider } from '@/vybekiit/ai';
import { createCmsFromEnv } from '@/vybekiit/cms';
import { resolveComplianceProvider } from '@/vybekiit/compliance';
import { resolveJobsProvider } from '@/vybekiit/jobs';
import { resolveKvProvider } from '@/vybekiit/kv';
import { resolveNotificationsProvider } from '@vybekiit/notifications';
import { resolveRealtimeProvider } from '@/vybekiit/realtime';
import { resolveSearchProvider } from '@/vybekiit/search';
import { resolveTenancyProvider } from '@/vybekiit/tenancy';

/**
 * Utility provider registry — the ONE place server modules resolve kit providers.
 *
 * Skills point agents here instead of scattering one-line `get*()` files across
 * `src/lib/`. Buyer-facing wire points (`auth-client.ts`, `billing-client.ts`)
 * stay separate because those are client-side API calls, not provider resolution.
 */

/** Server/client wire point for visitor stats — skill: add-analytics */
export function getAnalytics() {
  return resolveAnalyticsProvider();
}

/** Background jobs wire point */
export function getJobs() {
  return resolveJobsProvider();
}

/** Blog/content wire point — skill: add-blog */
export function getCms() {
  return createCmsFromEnv();
}

/** Cookie consent wire point */
export function getCompliance() {
  return resolveComplianceProvider();
}

/** Notification delivery wire point — skill: add-notifications */
export function getNotifications() {
  return resolveNotificationsProvider();
}

/** Search wire point — skill: add-search */
export function getSearch() {
  return resolveSearchProvider();
}

/** Server-only AI runtime wire point — skill: add-ai */
export function getAi() {
  return resolveAiProvider();
}

/** Live updates wire point */
export function getRealtime() {
  return resolveRealtimeProvider();
}

/** Fast storage wire point */
export function getKv() {
  return resolveKvProvider();
}

/** Team workspace wire point — skill: add-teams */
export function getTenancy() {
  return resolveTenancyProvider();
}
