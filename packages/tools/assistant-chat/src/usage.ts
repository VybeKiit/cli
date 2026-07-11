import type { VybeAssistant } from '@vybekiit/report-mode';
import { Schema } from 'effect';

import { VybeAssistantSchema } from './capabilities';

/**
 * Usage / plan contract. There is NO public usage API from Claude Code or Codex, so
 * every field is best-effort: whatever the bridge can observe (rate-limit lines the CLI
 * prints, a plan hint from env) fills in; everything else stays `available: false` and
 * renders as "unavailable". We never fabricate a number.
 */
export const AssistantUsage = Schema.Struct({
  assistant: VybeAssistantSchema,
  /** Reset cadence of the quota, when known. */
  window: Schema.optional(Schema.Literal('5h', 'weekly')),
  used: Schema.optional(Schema.Number),
  limit: Schema.optional(Schema.Number),
  plan: Schema.optional(Schema.String),
  /** False whenever we could not observe real numbers; the UI shows "unavailable". */
  available: Schema.Boolean,
});

/** Static type inferred from {@link AssistantUsage}. */
export type AssistantUsage = Schema.Schema.Type<typeof AssistantUsage>;

/** Observed usage fields scraped from a live assistant response. */
export type AssistantUsageObservation = {
  readonly used?: number;
  readonly limit?: number;
  readonly plan?: string;
};

/** Quota reset cadence by assistant (public knowledge; not a live number). */
const USAGE_WINDOW: Record<VybeAssistant, '5h' | 'weekly' | undefined> = {
  claude: '5h',
  codex: '5h',
  cursor: 'weekly',
  kiro: undefined,
  kimi: undefined,
  devin: undefined,
  grok: undefined,
};

/**
 * Build the usage contract for an assistant.
 *
 * @param assistant - Assistant whose quota surface should be described.
 * @param observed - Optional real usage data observed from CLI output or env.
 * @returns A usage record that is marked unavailable until real numbers are observed.
 * @example
 * const usage = buildAssistantUsage('claude', { used: 2, limit: 10, plan: 'Pro' });
 */
export const buildAssistantUsage = (
  assistant: VybeAssistant,
  observed?: AssistantUsageObservation,
): AssistantUsage => {
  const window = USAGE_WINDOW[assistant];
  const used = observed?.used;
  const limit = observed?.limit;
  const plan = observed?.plan;
  const hasNumbers = used !== undefined && limit !== undefined;

  return {
    assistant,
    ...(window ? { window } : {}),
    ...(used === undefined ? {} : { used }),
    ...(limit === undefined ? {} : { limit }),
    ...(plan ? { plan } : {}),
    available: Boolean(hasNumbers),
  };
};
