'use client';

import type { ModelsResponse } from '@vybekiit/assistant-chat/capabilities';
import type { VybeAssistant } from '@vybekiit/report-mode';
import { useCallback, useEffect, useState } from 'react';

/**
 * Load model choices for the selected assistant.
 *
 * @param bridgeUrl - Base URL of the local assistant chat bridge.
 * @param assistant - Assistant whose models should be listed.
 * @returns Model list state plus a manual refetch callback.
 * @example
 * const models = useAssistantModels('http://localhost:4319', 'codex');
 */
export const useAssistantModels = (
  bridgeUrl: string,
  assistant: VybeAssistant,
): {
  readonly data: ModelsResponse | null;
  readonly loading: boolean;
  readonly error: string | null;
  readonly refetch: () => void;
} => {
  const [data, setData] = useState<ModelsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((value) => value + 1), []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `tick` is a manual refetch trigger
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const url = `${bridgeUrl}/models?assistant=${encodeURIComponent(assistant)}`;
    void fetch(url)
      .then((response) => {
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
};
