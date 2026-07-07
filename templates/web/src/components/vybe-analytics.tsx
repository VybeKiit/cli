'use client';

import { Effect } from 'effect';
import { useEffect } from 'react';
import { getAnalytics } from '@/lib/providers';

/**
 * Inject the visitor-stats script when analytics is configured.
 *
 * @returns Nothing; the script is appended as a client-side effect.
 * @example
 * <VybeAnalytics />
 */
const VybeAnalytics = () => {
  useEffect(() => {
    const config = Effect.runSync(
      getAnalytics().pipe(
        Effect.flatMap((analytics) => analytics.getScriptConfig()),
        Effect.catchAll(() => Effect.succeed(null)),
      ),
    );

    if (config === null || config.src === undefined) {
      return;
    }

    const script = document.createElement('script');
    script.defer = true;
    script.src = config.src;
    if (config.domain !== undefined) {
      script.dataset.domain = config.domain;
    }
    document.head.appendChild(script);
  }, []);
  return null;
};

export { VybeAnalytics };
