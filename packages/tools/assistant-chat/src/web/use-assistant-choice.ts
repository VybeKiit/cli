'use client';

import type { VybeAssistant } from '@vybekiit/report-mode';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'vybe-assistant-choice';

export function useAssistantChoice(defaultAssistant: VybeAssistant): {
  readonly assistant: VybeAssistant;
  readonly setAssistant: (assistant: VybeAssistant) => void;
} {
  const [assistant, setAssistantState] = useState<VybeAssistant>(defaultAssistant);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (stored === 'claude' || stored === 'codex' || stored === 'cursor') {
      setAssistantState(stored);
    }
  }, []);

  const setAssistant = useCallback((next: VybeAssistant) => {
    setAssistantState(next);
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(STORAGE_KEY, next);
    }
  }, []);

  return { assistant, setAssistant };
}
