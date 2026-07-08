import type { AssistantModelOption } from '@vybekiit/assistant-chat/capabilities';
import type { VybeAssistant } from '@vybekiit/report-mode';

/** Static Claude model aliases used when the live model API is unavailable. */
export const CLAUDE_FALLBACK_MODELS: readonly AssistantModelOption[] = [
  { id: 'sonnet', label: 'Sonnet (latest)', default: true },
  { id: 'opus', label: 'Opus (latest)' },
  { id: 'haiku', label: 'Haiku (latest)' },
];

/** Static Codex model aliases used when the live model API is unavailable. */
export const CODEX_FALLBACK_MODELS: readonly AssistantModelOption[] = [
  { id: 'gpt-4.1', label: 'GPT-4.1', default: true },
  { id: 'o3', label: 'o3' },
  { id: 'o4-mini', label: 'o4-mini' },
];

// 'model = "o4-mini"' -> "o4-mini".
const codexModelLinePattern = /^\s*model\s*=\s*["']([^"']+)["']/m;

/**
 * Parse Anthropic's model list payload into assistant model options.
 *
 * @param payload - Unknown JSON payload returned by the Anthropic models API.
 * @returns Parsed model options, or static Claude aliases when the payload is unusable.
 * @example
 * const models = parseAnthropicModels({ data: [{ id: 'claude-sonnet-4', display_name: 'Sonnet' }] });
 */
export const parseAnthropicModels = (payload: unknown): readonly AssistantModelOption[] => {
  if (typeof payload !== 'object' || payload === null) {
    return CLAUDE_FALLBACK_MODELS;
  }
  const { data } = payload as { readonly data?: unknown };
  if (!Array.isArray(data)) {
    return CLAUDE_FALLBACK_MODELS;
  }
  const models = data
    .map((entry): AssistantModelOption | null => {
      if (typeof entry !== 'object' || entry === null) {
        return null;
      }
      const { display_name: displayName, id } = entry as {
        readonly display_name?: unknown;
        readonly id?: unknown;
      };
      if (typeof id !== 'string') {
        return null;
      }
      return {
        id,
        ...(typeof displayName === 'string' ? { label: displayName } : {}),
      } satisfies AssistantModelOption;
    })
    .filter((entry): entry is AssistantModelOption => entry !== null);
  return models.length > 0 ? models : CLAUDE_FALLBACK_MODELS;
};

/**
 * Parse OpenAI's model list payload into Codex model options.
 *
 * @param payload - Unknown JSON payload returned by the OpenAI models API.
 * @returns Parsed GPT/o-series model options, or static Codex aliases when the payload is unusable.
 * @example
 * const models = parseOpenAiModels({ data: [{ id: 'gpt-4.1' }, { id: 'o3' }] });
 */
export const parseOpenAiModels = (payload: unknown): readonly AssistantModelOption[] => {
  if (typeof payload !== 'object' || payload === null) {
    return CODEX_FALLBACK_MODELS;
  }
  const { data } = payload as { readonly data?: unknown };
  if (!Array.isArray(data)) {
    return CODEX_FALLBACK_MODELS;
  }
  const models = data
    .map((entry): AssistantModelOption | null => {
      if (typeof entry !== 'object' || entry === null) {
        return null;
      }
      const { id } = entry as { readonly id?: unknown };
      if (typeof id !== 'string' || !(id.startsWith('gpt-') || id.startsWith('o'))) {
        return null;
      }
      return { id } satisfies AssistantModelOption;
    })
    .filter((entry): entry is AssistantModelOption => entry !== null)
    .slice(0, 24);
  return models.length > 0 ? models : CODEX_FALLBACK_MODELS;
};

/**
 * Parse the selected Codex model from a config.toml file.
 *
 * @param toml - Raw Codex config file contents.
 * @returns The configured model id, or undefined when no model line exists.
 * @example
 * const model = parseCodexConfigModel('model = "o4-mini"');
 */
export const parseCodexConfigModel = (toml: string): string | undefined => {
  const match = toml.match(codexModelLinePattern);

  if (match === null) {
    return;
  }

  const [, model] = match;

  if (typeof model !== 'string') {
    return;
  }

  return model;
};

/**
 * Build Cursor's model response.
 *
 * @returns A fallback response because Cursor does not expose a local model API here.
 * @example
 * const response = cursorModelsResponse();
 */
export const cursorModelsResponse = (): {
  readonly assistant: VybeAssistant;
  readonly models: readonly AssistantModelOption[];
  readonly source: 'fallback';
} => ({ assistant: 'cursor', models: [], source: 'fallback' });
