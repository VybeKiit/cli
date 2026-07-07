import type { PlausibleConfigType } from '@vybekiit/analytics/config';
import type { AnalyticsProvider, ScriptConfigType } from '@vybekiit/analytics/types';
import { Effect } from 'effect';

const defaultPlausibleHost = 'https://plausible.io';

const resolvePlausibleHost = (config: PlausibleConfigType): string => {
  if (config.PLAUSIBLE_API_HOST === undefined) {
    return defaultPlausibleHost;
  }

  return config.PLAUSIBLE_API_HOST;
};

const createPlausibleScriptConfig = (config: PlausibleConfigType): ScriptConfigType => {
  const host = resolvePlausibleHost(config);

  return {
    src: `${host}/js/script.js`,
    domain: config.PLAUSIBLE_DOMAIN,
    inlineScript: `window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)};plausible('pageview');`,
  };
};

/**
 * Build the Plausible analytics adapter from validated Plausible config.
 *
 * @param config - Plausible credentials decoded from {@link PlausibleConfigSchema}.
 * @returns An AnalyticsProvider that exposes Plausible script config as an Effect.
 * @example
 * const provider = createPlausibleAnalytics({ PLAUSIBLE_DOMAIN: 'example.com' });
 */
export const createPlausibleAnalytics = (config: PlausibleConfigType): AnalyticsProvider => ({
  name: 'plausible',
  track: () => Effect.void,
  identify: () => Effect.void,
  getScriptConfig: () => Effect.succeed(createPlausibleScriptConfig(config)),
});
