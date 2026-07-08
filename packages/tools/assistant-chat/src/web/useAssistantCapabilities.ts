'use client';

import type { CapabilitiesResponse } from '@vybekiit/assistant-chat/capabilities';
import { useCallback, useEffect, useState } from 'react';

/**
 * Load local assistant bridge capabilities.
 *
 * @param bridgeUrl - Base URL of the local assistant chat bridge.
 * @returns Capability state plus a manual refetch callback.
 * @example
 * const capabilities = useAssistantCapabilities('http://localhost:4319');
 */
export const useAssistantCapabilities = (
  bridgeUrl: string,
): {
  readonly data: CapabilitiesResponse | null;
  readonly loading: boolean;
  readonly error: string | null;
  readonly refetch: () => void;
} => {
  const [data, setData] = useState<CapabilitiesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((value) => value + 1), []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `tick` is a manual refetch trigger
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetch(`${bridgeUrl}/capabilities`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`${response.status} ${response.statusText}`);
        }
        return response.json() as Promise<CapabilitiesResponse>;
      })
      .then((payload) => {
        if (!cancelled) {
          setData(payload);
          setError(null);
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : 'capabilities fetch failed');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [bridgeUrl, tick]);

  return { data, loading, error, refetch };
};
