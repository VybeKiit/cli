'use client';

import type { VybeAssistant } from '@vybekiit/report-mode';
import { useCallback, useEffect, useState } from 'react';

import type { ModelsResponse } from '../capabilities';

export function useAssistantModels(
  bridgeUrl: string,
  assistant: VybeAssistant,
): {
  readonly data: ModelsResponse | null;
  readonly loading: boolean;
  readonly error: string | null;
  readonly refetch: () => void;
} {
  const [data, setData] = useState<ModelsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const url = `${bridgeUrl}/models?assistant=${encodeURIComponent(assistant)}`;
    void fetch(url)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`${response.status} ${response.statusText}`);
        }
        return response.json() as Promise<ModelsResponse>;
      })
      .then((payload) => {
        if (!cancelled) {
          setData(payload);
          setError(null);
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : 'models fetch failed');
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
  }, [assistant, bridgeUrl, tick]);

  return { data, loading, error, refetch };
}
