'use client';

import type { VybeAssistant } from '@vybekiit/report-mode';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'vybe-assistant-choice';

const isAssistantChoice = (value: string | null): value is VybeAssistant =>
  value === 'claude' || value === 'codex' || value === 'cursor';

const readStoredAssistant = (): VybeAssistant | null => {
  if (typeof globalThis.sessionStorage === 'undefined') {
    return null;
  }

  try {
    const stored = globalThis.sessionStorage.getItem(STORAGE_KEY);

    if (isAssistantChoice(stored)) {
      return stored;
    }
  } catch {
    return null;
  }

  return null;
};

const writeStoredAssistant = (assistant: VybeAssistant): void => {
  if (typeof globalThis.sessionStorage === 'undefined') {
    return;
  }

  try {
    globalThis.sessionStorage.setItem(STORAGE_KEY, assistant);
  } catch {
    // Session storage failures should not block the in-memory selection.
  }
};

/**
 * Keep the selected assistant in session storage for the current dev session.
 *
 * @param defaultAssistant - Assistant selected by the surrounding report-mode environment.
 * @returns The selected assistant and setter.
 * @example
 * const choice = useAssistantChoice('codex');
 */
export const useAssistantChoice = (
  defaultAssistant: VybeAssistant,
): {
  readonly assistant: VybeAssistant;
  readonly setAssistant: (assistant: VybeAssistant) => void;
} => {
  const [assistant, setAssistantState] = useState<VybeAssistant>(defaultAssistant);

  useEffect(() => {
    const stored = readStoredAssistant();

    if (stored !== null) {
      setAssistantState(stored);
    }
  }, []);

  const setAssistant = useCallback((next: VybeAssistant) => {
    setAssistantState(next);
    writeStoredAssistant(next);
  }, []);

  return { assistant, setAssistant };
};
