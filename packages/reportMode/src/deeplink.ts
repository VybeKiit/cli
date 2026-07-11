import { isVybeAssistantId, type VybeAssistant } from './types';

type AssistantDeepLinkBuilder = (cwd: string, prompt: string) => string | null;

/**
 * Native URL-scheme builders. Assistants without a known scheme return null so
 * the host can fall back to opening a real terminal with the CLI instead.
 */
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
  // No stable public deeplink schemes for these CLIs yet.
  kiro: () => null,
  kimi: () => null,
  devin: () => null,
  grok: () => null,
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
  if (normalized.length === 0 || !isVybeAssistantId(normalized)) {
    return null;
  }

  return normalized;
};

/**
 * Whether the assistant has a native URL scheme for one-click handoff.
 *
 * @param assistant - Assistant runtime to check.
 * @returns True when {@link buildAssistantDeepLink} can produce a URL.
 * @example
 * supportsAssistantDeepLink('cursor'); // true
 */
export const supportsAssistantDeepLink = (assistant: VybeAssistant): boolean =>
  assistantDeepLinkBuilders[assistant]('', '') !== null;

/**
 * Build a native assistant deeplink URL prefilled with a report prompt.
 *
 * @param assistant - Assistant runtime selected for handoff.
 * @param cwd - Current project directory used by assistants that accept it.
 * @param prompt - Structured report prompt to prefill.
 * @returns A native deeplink URL, or null when the assistant has no scheme.
 * @example
 * const url = buildAssistantDeepLink('cursor', cwd, prompt);
 */
export const buildAssistantDeepLink = (
  assistant: VybeAssistant,
  cwd: string,
  prompt: string,
): string | null => assistantDeepLinkBuilders[assistant](cwd, prompt);

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
  readonly kiroInstalled?: boolean;
  readonly kimiInstalled?: boolean;
  readonly grokInstalled?: boolean;
  readonly devinInstalled?: boolean;
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
  if (options.kiroInstalled === true) {
    return 'kiro';
  }
  if (options.kimiInstalled === true) {
    return 'kimi';
  }
  if (options.grokInstalled === true) {
    return 'grok';
  }
  if (options.devinInstalled === true) {
    return 'devin';
  }
  return null;
};
