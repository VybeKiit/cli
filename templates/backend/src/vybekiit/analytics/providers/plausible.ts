import type { PlausibleConfig } from '@vybekiit/core';
import type { AnalyticsProvider, ScriptConfig } from '../types.js';

export function createPlausibleAnalytics(config: PlausibleConfig): AnalyticsProvider {
  const host = config.PLAUSIBLE_API_HOST ?? 'https://plausible.io';
  return {
    name: 'plausible',
    track(): void {},
    identify(): void {},
    getScriptConfig(): ScriptConfig {
      return {
        src: `${host}/js/script.js`,
        domain: config.PLAUSIBLE_DOMAIN,
        inlineScript: `window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)};plausible('pageview');`,
      };
    },
  };
}
