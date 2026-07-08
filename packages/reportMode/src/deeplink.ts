import type { VybeAssistant } from './types';

const ASSISTANTS: readonly VybeAssistant[] = ['cursor', 'claude', 'codex'];

type AssistantDeepLinkBuilder = (cwd: string, prompt: string) => string;

const assistantDeepLinkBuilders: Record<VybeAssistant, AssistantDeepLinkBuilder> = {
  cursor: (_cwd, prompt) => {
    const url = new URL('cursor://anysphere.cursor-deeplink/prompt');
    url.searchParams.set('text', prompt);
    return url.toString();
  },
  claude: (cwd, prompt) => {
    const url = new URL('claude-cli://open');
    url.searchParams.set('q', prompt);
    if (cwd.length > 0) {
      url.searchParams.set('cwd', cwd);
    }
    return url.toString();
  },
  codex: (_cwd, prompt) => {
    const url = new URL('codex://new');
    url.searchParams.set('prompt', prompt);
    return url.toString();
  },
};

/**
 * Read the first configured assistant env value.
 *
 * @param env - Environment variables from a template or extension runtime.
 * @returns The raw assistant value, or `undefined` when no supported key is set.
 * @example
 * const raw = readAssistantEnv(process.env);
 */
const readAssistantEnv = (env: Record<string, string | undefined>): string | undefined => {
  if (env.VYBE_ASSISTANT !== undefined) {
    return env.VYBE_ASSISTANT;
  }

  if (env.WXT_PUBLIC_VYBE_ASSISTANT !== undefined) {
    return env.WXT_PUBLIC_VYBE_ASSISTANT;
  }

  return env.EXPO_PUBLIC_VYBE_ASSISTANT;
};

/**
 * Check whether a normalized env value names a supported assistant.
 *
 * @param value - Normalized env value to test.
 * @returns `true` when the value is a supported assistant id.
 * @example
 * const valid = isVybeAssistant('cursor');
 */
const isVybeAssistant = (value: string): value is VybeAssistant =>
  ASSISTANTS.includes(value as VybeAssistant);

/**
 * Read `VYBE_ASSISTANT` or template-prefixed variants from env.
 *
 * @param env - Environment variables from a template or extension runtime.
 * @returns The configured assistant id, or `null` when unset or unsupported.
 * @example
 * const assistant = resolveVybeAssistant(process.env);
 */
export const resolveVybeAssistant = (
  env: Record<string, string | undefined>,
): VybeAssistant | null => {
  const raw = readAssistantEnv(env);
  if (raw === undefined) {
    return null;
  }

  const normalized = raw.trim().toLowerCase();
  if (normalized.length === 0 || !isVybeAssistant(normalized)) {
    return null;
  }

  return normalized;
};

/**
 * Build a native assistant deeplink URL prefilled with a report prompt.
 *
 * @param assistant - Assistant runtime selected for handoff.
 * @param cwd - Current project directory used by assistants that accept it.
 * @param prompt - Structured report prompt to prefill.
 * @returns A native deeplink URL for the selected assistant.
 * @example
 * const url = buildAssistantDeepLink('cursor', cwd, prompt);
 */
export const buildAssistantDeepLink = (
  assistant: VybeAssistant,
  cwd: string,
  prompt: string,
): string => assistantDeepLinkBuilders[assistant](cwd, prompt);

/**
 * Infer which assistant doctor should persist for future report handoff.
 *
 * @param options - Detected local assistant availability signals.
 * @returns The preferred assistant id, or `null` when none are available.
 * @example
 * const assistant = inferVybeAssistant({ cursorSession: true, claudeInstalled: false, codexInstalled: true });
 */
export const inferVybeAssistant = (options: {
  readonly cursorSession: boolean;
  readonly claudeInstalled: boolean;
  readonly codexInstalled: boolean;
}): VybeAssistant | null => {
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
};
