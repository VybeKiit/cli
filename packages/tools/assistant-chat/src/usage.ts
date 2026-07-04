import type { VybeAssistant } from '@vybekiit/report-mode';
import { Schema } from 'effect';

/**
 * Usage / plan contract. There is NO public usage API from Claude Code or Codex, so
 * every field is best-effort: whatever the bridge can observe (rate-limit lines the CLI
 * prints, a plan hint from env) fills in; everything else stays `available: false` and
 * renders as "unavailable". We never fabricate a number.
 */
export const AssistantUsage = Schema.Struct({
  assistant: Schema.Literal('cursor', 'claude', 'codex'),
  /** Reset cadence of the quota, when known. */
  window: Schema.optional(Schema.Literal('5h', 'weekly')),
  used: Schema.optional(Schema.Number),
  limit: Schema.optional(Schema.Number),
  plan: Schema.optional(Schema.String),
  /** False whenever we could not observe real numbers — the UI shows "unavailable". */
  available: Schema.Boolean,
});
export type AssistantUsage = Schema.Schema.Type<typeof AssistantUsage>;

/** Quota reset cadence by assistant (public knowledge; not a live number). */
const USAGE_WINDOW: Record<VybeAssistant, '5h' | 'weekly' | undefined> = {
  claude: '5h',
  codex: '5h',
  cursor: 'weekly',
};

/**
 * Build the usage contract for an assistant. With no observed data this returns an
 * honestly-empty record (`available: false`); pass `observed` to fill real fields.
 */
export function buildAssistantUsage(
  assistant: VybeAssistant,
  observed?: { used?: number; limit?: number; plan?: string },
): AssistantUsage {
  const window = USAGE_WINDOW[assistant];
  const hasNumbers = observed?.used !== undefined && observed?.limit !== undefined;
  return {
    assistant,
    ...(window ? { window } : {}),
    ...(observed?.used === undefined ? {} : { used: observed.used }),
    ...(observed?.limit === undefined ? {} : { limit: observed.limit }),
    ...(observed?.plan ? { plan: observed.plan } : {}),
    available: Boolean(hasNumbers),
  };
}
