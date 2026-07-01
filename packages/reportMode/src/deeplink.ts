import type { VybeAssistant } from './types';

const ASSISTANTS: readonly VybeAssistant[] = ['cursor', 'claude', 'codex'];

/** Read `VYBE_ASSISTANT` (or template-prefixed variants) from env; null when unset. */
export function resolveVybeAssistant(
  env: Record<string, string | undefined>,
): VybeAssistant | null {
  const raw = env.VYBE_ASSISTANT ?? env.WXT_PUBLIC_VYBE_ASSISTANT ?? env.EXPO_PUBLIC_VYBE_ASSISTANT;
  const normalized = raw?.trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  return ASSISTANTS.includes(normalized as VybeAssistant) ? (normalized as VybeAssistant) : null;
}

/**
 * Build a native deeplink URL that pre-fills the assistant with `prompt`.
 * User still confirms send — handlers never auto-submit.
 */
export function buildAssistantDeepLink(
  assistant: VybeAssistant,
  cwd: string,
  prompt: string,
): string {
  switch (assistant) {
    case 'cursor': {
      const url = new URL('cursor://anysphere.cursor-deeplink/prompt');
      url.searchParams.set('text', prompt);
      return url.toString();
    }
    case 'claude': {
      const url = new URL('claude-cli://open');
      url.searchParams.set('q', prompt);
      if (cwd) {
        url.searchParams.set('cwd', cwd);
      }
      return url.toString();
    }
    case 'codex': {
      const url = new URL('codex://new');
      url.searchParams.set('prompt', prompt);
      return url.toString();
    }
  }
}

/** Pick assistant for doctor to persist: Cursor session wins, then claude, then codex. */
export function inferVybeAssistant(options: {
  readonly cursorSession: boolean;
  readonly claudeInstalled: boolean;
  readonly codexInstalled: boolean;
}): VybeAssistant | null {
  if (options.cursorSession) {
    return 'cursor';
  }
  if (options.claudeInstalled) {
    return 'claude';
  }
  if (options.codexInstalled) {
    return 'codex';
  }
  return null;
}
