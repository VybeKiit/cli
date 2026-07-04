import type { VybeAssistant } from '@vybekiit/report-mode';

import type { AssistantModelOption } from '../../capabilities';

export const CLAUDE_FALLBACK_MODELS: readonly AssistantModelOption[] = [
  { id: 'sonnet', label: 'Sonnet (latest)', default: true },
  { id: 'opus', label: 'Opus (latest)' },
  { id: 'haiku', label: 'Haiku (latest)' },
];

export const CODEX_FALLBACK_MODELS: readonly AssistantModelOption[] = [
  { id: 'gpt-4.1', label: 'GPT-4.1', default: true },
  { id: 'o3', label: 'o3' },
  { id: 'o4-mini', label: 'o4-mini' },
];

export function parseAnthropicModels(payload: unknown): readonly AssistantModelOption[] {
  if (typeof payload !== 'object' || payload === null) {
    return CLAUDE_FALLBACK_MODELS;
  }
  const data = (payload as { data?: unknown }).data;
  if (!Array.isArray(data)) {
    return CLAUDE_FALLBACK_MODELS;
  }
  const models = data
    .map((entry) => {
      if (typeof entry !== 'object' || entry === null) {
        return null;
      }
      const id = (entry as { id?: unknown }).id;
      const displayName = (entry as { display_name?: unknown }).display_name;
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
}

export function parseOpenAiModels(payload: unknown): readonly AssistantModelOption[] {
  if (typeof payload !== 'object' || payload === null) {
    return CODEX_FALLBACK_MODELS;
  }
  const data = (payload as { data?: unknown }).data;
  if (!Array.isArray(data)) {
    return CODEX_FALLBACK_MODELS;
  }
  const models = data
    .map((entry) => {
      if (typeof entry !== 'object' || entry === null) {
        return null;
      }
      const id = (entry as { id?: unknown }).id;
      if (typeof id !== 'string' || !(id.startsWith('gpt-') || id.startsWith('o'))) {
        return null;
      }
      return { id } satisfies AssistantModelOption;
    })
    .filter((entry): entry is AssistantModelOption => entry !== null)
    .slice(0, 24);
  return models.length > 0 ? models : CODEX_FALLBACK_MODELS;
}

export function parseCodexConfigModel(toml: string): string | undefined {
  const match = toml.match(/^\s*model\s*=\s*["']([^"']+)["']/m);
  return match?.[1];
}

export function cursorModelsResponse(): {
  readonly assistant: VybeAssistant;
  readonly models: readonly AssistantModelOption[];
  readonly source: 'fallback';
} {
  return { assistant: 'cursor', models: [], source: 'fallback' };
}
