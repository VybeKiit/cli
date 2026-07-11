import { resolveAnalyticsProvider } from '@vybekiit/analytics';
import { resolveAiProvider } from '@vybekiit/ai';
import { createCmsFromEnv } from '@vybekiit/content';
import { createComplianceFromEnv } from '@vybekiit/compliance';
import { resolveJobsProvider } from '@vybekiit/infra';
import { resolveKvProvider } from '@vybekiit/infra';
import { resolveNotificationsProvider } from '@vybekiit/messaging';
import { resolveRealtimeProvider } from '@vybekiit/realtime';
import { resolveSearchProvider } from '@vybekiit/db';
import { resolveTenancyProvider } from '@vybekiit/tenancy';

/**
 * Resolve the analytics provider from the template environment.
 *
 * @returns An analytics service effect for visitor stats.
 * @example
 * const analytics = await Effect.runPromise(getAnalytics());
 */
const getAnalytics = () => resolveAnalyticsProvider();

/**
 * Resolve the background jobs provider from the template environment.
 *
 * @returns A jobs service backed by the selected adapter.
 * @example
 * const jobs = getJobs();
 */
const getJobs = () => resolveJobsProvider();

/**
 * Resolve the CMS provider used by buyer blog and content routes.
 *
 * @returns A CMS service backed by MDX until the buyer adds another adapter.
 * @example
 * const cms = getCms();
 */
const getCms = () => createCmsFromEnv();

/**
 * Resolve the compliance provider used by cookie and privacy features.
 *
 * @returns A compliance service backed by the selected adapter.
 * @example
 * const compliance = getCompliance();
 */
const getCompliance = () => createComplianceFromEnv();

/**
 * Resolve the notification provider for outbound messages.
 *
 * @returns A notification service backed by the selected adapter.
 * @example
 * const notifications = getNotifications();
 */
const getNotifications = () => resolveNotificationsProvider();

/**
 * Resolve the search provider used by buyer content search.
 *
 * @returns A search service backed by the selected adapter.
 * @example
 * const search = getSearch();
 */
const getSearch = () => resolveSearchProvider();

/**
 * Resolve the server-only AI runtime provider.
 *
 * @returns An AI service effect backed by the selected adapter.
 * @example
 * const ai = await Effect.runPromise(getAi());
 */
const getAi = () => resolveAiProvider();

/**
 * Resolve the realtime provider for live buyer app updates.
 *
 * @returns A realtime service backed by the selected adapter.
 * @example
 * const realtime = getRealtime();
 */
const getRealtime = () => resolveRealtimeProvider();

/**
 * Resolve the key-value storage provider for fast reads and writes.
 *
 * @returns A KV service backed by the selected adapter.
 * @example
 * const kv = getKv();
 */
const getKv = () => resolveKvProvider();

/**
 * Resolve the tenancy provider for team workspace features.
 *
 * @returns A tenancy service backed by the selected adapter.
 * @example
 * const tenancy = getTenancy();
 */
const getTenancy = () => resolveTenancyProvider();

export {
  getAi,
  getAnalytics,
  getCms,
  getCompliance,
  getJobs,
  getKv,
  getNotifications,
  getRealtime,
  getSearch,
  getTenancy,
};
