import type { VybeAssistant } from '@vybekiit/report-mode';
import { Schema } from 'effect';

/** One selectable model entry returned to the assistant chat UI. */
export const AssistantModelOption = Schema.Struct({
  id: Schema.String,
  label: Schema.optional(Schema.String),
  default: Schema.optional(Schema.Boolean),
});

/** Static type inferred from {@link AssistantModelOption}. */
export type AssistantModelOption = Schema.Schema.Type<typeof AssistantModelOption>;

/** One assistant's locally observed bridge capability. */
export const AssistantCapability = Schema.Struct({
  id: Schema.Literal('cursor', 'claude', 'codex'),
  streaming: Schema.Boolean,
  modelPicker: Schema.Boolean,
  installed: Schema.Boolean,
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
  assistant: Schema.Literal('cursor', 'claude', 'codex'),
  models: Schema.Array(AssistantModelOption),
  source: Schema.Literal('live', 'fallback'),
  fetchedAt: Schema.String,
});

/** Static type inferred from {@link ModelsResponse}. */
export type ModelsResponse = Schema.Schema.Type<typeof ModelsResponse>;

/** Optional assistant/model override for a single outgoing turn. */
export const SendTurnOptions = Schema.Struct({
  assistant: Schema.optional(Schema.Literal('cursor', 'claude', 'codex')),
  model: Schema.optional(Schema.String),
});

/** Static type inferred from {@link SendTurnOptions} with report-mode assistant ids. */
export type SendTurnOptions = Schema.Schema.Type<typeof SendTurnOptions> & {
  readonly assistant?: VybeAssistant;
};
