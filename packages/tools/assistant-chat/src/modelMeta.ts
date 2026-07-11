import type { VybeAssistant } from '@vybekiit/report-mode';

/**
 * Published API cost + context for a coding-agent model.
 * Amounts are USD per million tokens (MTok). Sourced from vendor pricing pages
 * (Anthropic / OpenAI) and refreshed when models change.
 */
export type ModelCostMeta = {
  readonly inputPerMTokUsd: number;
  readonly outputPerMTokUsd: number;
  /** Max context window in tokens. */
  readonly contextTokens: number;
  /** Short note when pricing is intro/promotional or alias-based. */
  readonly pricingNote?: string;
};

/** Claude Code aliases + live Anthropic model ids → official Claude API rates (as of 2026-07). */
const CLAUDE_COST_TABLE: readonly {
  readonly match: RegExp;
  readonly meta: ModelCostMeta;
}[] = [
  // Order matters: more specific patterns first.
  // Opus family (4.5+) — $5 / $25, 1M context at standard rates.
  {
    match: /opus|claude-opus-4/i,
    meta: {
      inputPerMTokUsd: 5,
      outputPerMTokUsd: 25,
      contextTokens: 1_000_000,
    },
  },
  // Sonnet 5 intro pricing through 2026-08-31: $2 / $10.
  {
    match: /sonnet[-_]?5|claude-sonnet-5/i,
    meta: {
      inputPerMTokUsd: 2,
      outputPerMTokUsd: 10,
      contextTokens: 1_000_000,
      pricingNote: 'Sonnet 5 intro rate through Aug 31, 2026',
    },
  },
  // Sonnet 4.x live ids — $3 / $15, 1M context.
  {
    match: /sonnet[-_]?4|claude-sonnet-4/i,
    meta: {
      inputPerMTokUsd: 3,
      outputPerMTokUsd: 15,
      contextTokens: 1_000_000,
    },
  },
  // Claude Code alias `sonnet` → latest Sonnet (Sonnet 5 intro mid-2026).
  {
    match: /^sonnet$/i,
    meta: {
      inputPerMTokUsd: 2,
      outputPerMTokUsd: 10,
      contextTokens: 1_000_000,
      pricingNote: 'Claude Code Sonnet (latest) · intro rate through Aug 31, 2026',
    },
  },
  // Any other sonnet-named id falls back to Sonnet 4.x rates.
  {
    match: /sonnet/i,
    meta: {
      inputPerMTokUsd: 3,
      outputPerMTokUsd: 15,
      contextTokens: 1_000_000,
    },
  },
  // Haiku 4.5 / alias.
  {
    match: /haiku|claude-haiku/i,
    meta: {
      inputPerMTokUsd: 1,
      outputPerMTokUsd: 5,
      contextTokens: 200_000,
    },
  },
];

/** Codex / OpenAI model ids → published OpenAI API rates (as of 2026-07). */
const CODEX_COST_TABLE: readonly {
  readonly match: RegExp;
  readonly meta: ModelCostMeta;
}[] = [
  {
    match: /^o4-mini|o4_mini/i,
    meta: {
      inputPerMTokUsd: 1.1,
      outputPerMTokUsd: 4.4,
      contextTokens: 200_000,
    },
  },
  {
    match: /^o3-mini|o3_mini/i,
    meta: {
      inputPerMTokUsd: 1.1,
      outputPerMTokUsd: 4.4,
      contextTokens: 200_000,
    },
  },
  {
    match: /^o3$/i,
    meta: {
      inputPerMTokUsd: 2,
      outputPerMTokUsd: 8,
      contextTokens: 200_000,
    },
  },
  {
    match: /gpt-4\.1-nano|gpt-4-1-nano/i,
    meta: {
      inputPerMTokUsd: 0.1,
      outputPerMTokUsd: 0.4,
      contextTokens: 1_000_000,
    },
  },
  {
    match: /gpt-4\.1-mini|gpt-4-1-mini/i,
    meta: {
      inputPerMTokUsd: 0.4,
      outputPerMTokUsd: 1.6,
      contextTokens: 1_000_000,
    },
  },
  {
    match: /gpt-4\.1|gpt-4-1/i,
    meta: {
      inputPerMTokUsd: 2,
      outputPerMTokUsd: 8,
      contextTokens: 1_000_000,
    },
  },
  {
    match: /gpt-4o-mini/i,
    meta: {
      inputPerMTokUsd: 0.15,
      outputPerMTokUsd: 0.6,
      contextTokens: 128_000,
    },
  },
  {
    match: /gpt-4o/i,
    meta: {
      inputPerMTokUsd: 2.5,
      outputPerMTokUsd: 10,
      contextTokens: 128_000,
    },
  },
];

const lookup = (
  table: readonly { readonly match: RegExp; readonly meta: ModelCostMeta }[],
  modelId: string,
): ModelCostMeta | null => {
  for (const row of table) {
    if (row.match.test(modelId)) {
      return row.meta;
    }
  }
  return null;
};

/**
 * Resolve published input/output cost + context for an agent model id.
 * Matches Claude Code aliases (`sonnet`/`opus`/`haiku`) and live provider ids.
 *
 * @param assistant - Active coding agent.
 * @param modelId - Model id from the bridge model list.
 * @returns Cost meta when known; null when the agent has no public token pricing.
 * @example
 * resolveModelCostMeta('claude', 'sonnet');
 */
export const resolveModelCostMeta = (
  assistant: VybeAssistant,
  modelId: string,
): ModelCostMeta | null => {
  const id = modelId.trim();
  if (id.length === 0) {
    return null;
  }

  if (assistant === 'claude') {
    return lookup(CLAUDE_COST_TABLE, id);
  }

  if (assistant === 'codex') {
    return lookup(CODEX_COST_TABLE, id);
  }

  // Cursor / Kiro / Kimi / Devin / Grok open outside token-billed APIs here.
  return null;
};

/**
 * Format a USD-per-MTok amount for the model picker chips.
 *
 * @param amount - Dollars per million tokens.
 * @returns Compact label like `$3` or `$1.10`.
 * @example
 * formatUsdPerMTok(1.1); // '$1.10'
 */
export const formatUsdPerMTok = (amount: number): string => {
  if (Number.isInteger(amount)) {
    return `$${amount}`;
  }
  const fixed = amount.toFixed(2);
  // Strip trailing zeros: 1.10 → 1.1 only when second decimal is 0… keep two for money clarity.
  return `$${fixed}`;
};

/**
 * Format a context window size for the model picker.
 *
 * @param tokens - Context length in tokens.
 * @returns Compact label like `200K` or `1M`.
 * @example
 * formatContextTokens(1_000_000); // '1M'
 */
export const formatContextTokens = (tokens: number): string => {
  if (tokens >= 1_000_000) {
    const millions = tokens / 1_000_000;
    return Number.isInteger(millions) ? `${millions}M` : `${millions.toFixed(1)}M`;
  }
  if (tokens >= 1000) {
    const thousands = tokens / 1000;
    return Number.isInteger(thousands) ? `${thousands}K` : `${thousands.toFixed(1)}K`;
  }
  return `${tokens}`;
};
