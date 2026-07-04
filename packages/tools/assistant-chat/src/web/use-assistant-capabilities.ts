'use client';

import { useCallback, useEffect, useState } from 'react';

import type { CapabilitiesResponse } from '../capabilities';

export function useAssistantCapabilities(bridgeUrl: string): {
  readonly data: CapabilitiesResponse | null;
  readonly loading: boolean;
  readonly error: string | null;
  readonly refetch: () => void;
} {
  const [data, setData] = useState<CapabilitiesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetch(`${bridgeUrl}/capabilities`)
      .then(async (response) => {
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
}
