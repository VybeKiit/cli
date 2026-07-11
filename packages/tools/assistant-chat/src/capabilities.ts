import { isVybeAssistantId, type VybeAssistant } from '@vybekiit/report-mode';
import { Schema } from 'effect';

/** Schema literal covering every supported assistant id. */
export const VybeAssistantSchema = Schema.Literal(
  'claude',
  'codex',
  'cursor',
  'kiro',
  'kimi',
  'devin',
  'grok',
);

/** One selectable model entry returned to the assistant chat UI. */
export const AssistantModelOption = Schema.Struct({
  id: Schema.String,
  label: Schema.optional(Schema.String),
  default: Schema.optional(Schema.Boolean),
});

/** Static type inferred from {@link AssistantModelOption}. */
export type AssistantModelOption = Schema.Schema.Type<typeof AssistantModelOption>;

/** How the UI should open this assistant for a turn. */
export const AssistantOpenMode = Schema.Literal('stream', 'deeplink', 'terminal');

/** Static type inferred from {@link AssistantOpenMode}. */
export type AssistantOpenMode = Schema.Schema.Type<typeof AssistantOpenMode>;

/** One assistant's locally observed bridge capability. */
export const AssistantCapability = Schema.Struct({
  id: VybeAssistantSchema,
  streaming: Schema.Boolean,
  modelPicker: Schema.Boolean,
  installed: Schema.Boolean,
  openMode: AssistantOpenMode,
  reason: Schema.optional(Schema.String),
});

/** Static type inferred from {@link AssistantCapability}. */
export type AssistantCapability = Schema.Schema.Type<typeof AssistantCapability>;

/** Local bridge capability response consumed by the browser panel. */
export const CapabilitiesResponse = Schema.Struct({
  assistants: Schema.Array(AssistantCapability),
});

/** Static type inferred from {@link CapabilitiesResponse}. */
export type CapabilitiesResponse = Schema.Schema.Type<typeof CapabilitiesResponse>;

/** Model list response for one assistant. */
export const ModelsResponse = Schema.Struct({
  assistant: VybeAssistantSchema,
  models: Schema.Array(AssistantModelOption),
  source: Schema.Literal('live', 'fallback'),
  fetchedAt: Schema.String,
});

/** Static type inferred from {@link ModelsResponse}. */
export type ModelsResponse = Schema.Schema.Type<typeof ModelsResponse>;

/** Optional assistant/model override for a single outgoing turn. */
export const SendTurnOptions = Schema.Struct({
  assistant: Schema.optional(VybeAssistantSchema),
  model: Schema.optional(Schema.String),
  /** Native CLI session id so the daemon can resume with official flags. */
  agentSessionId: Schema.optional(Schema.String),
  /** Project folder for this turn (CLI session cwd). */
  cwd: Schema.optional(Schema.String),
});

/** Static type inferred from {@link SendTurnOptions} with report-mode assistant ids. */
export type SendTurnOptions = Schema.Schema.Type<typeof SendTurnOptions> & {
  readonly assistant?: VybeAssistant;
};

/**
 * Parse a raw query/body assistant id into a typed assistant.
 *
 * @param value - Raw assistant string.
 * @returns Typed assistant id, or null when invalid.
 * @example
 * parseAssistantId('claude');
 */
export const parseAssistantId = (value: string | null | undefined): VybeAssistant | null => {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  return isVybeAssistantId(normalized) ? normalized : null;
};
