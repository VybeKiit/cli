import type { VybeAssistant } from '@vybekiit/report-mode';

/**
 * Upgrade / referral link per assistant. Cursor and Claude Code both expose real
 * referral programs (new-user perks, no fabricated commission); Codex has none, so it
 * falls back to a plain pricing URL. A per-assistant slot keeps this honest and lets a
 * different link drop in later without a UI change.
 */

/** Cursor referral: a `?code=` query. Overridable via env for a different code. */
const CURSOR_REFERRAL_DEFAULT = 'UVR8G4POWR7J';
/** Claude Code referral: a path-based link. */
const CLAUDE_REFERRAL_URL = 'https://claude.ai/referral/P5LD5z3EOQ';
/** Codex has no referral program, so the upgrade link is the plain pricing page. */
const CODEX_PRICING_URL = 'https://openai.com/chatgpt/pricing';

const resolveCursorReferralCode = (referralCode?: string): string => {
  if (typeof referralCode === 'string') {
    return referralCode;
  }

  return CURSOR_REFERRAL_DEFAULT;
};

const assistantUpgradeUrlResolvers = {
  claude: () => CLAUDE_REFERRAL_URL,
  codex: () => CODEX_PRICING_URL,
  cursor: (referralCode?: string) => {
    const url = new URL('https://cursor.com/referral');
    url.searchParams.set('code', resolveCursorReferralCode(referralCode));
    return url.toString();
  },
} satisfies Record<VybeAssistant, (referralCode?: string) => string>;

/**
 * Resolve the upgrade URL for an assistant.
 *
 * @param assistant - Active assistant whose upgrade surface should open.
 * @param referralCode - Optional Cursor referral code override.
 * @returns A provider-specific upgrade or referral URL.
 * @example
 * const url = resolveUpgradeUrl('cursor', 'CUSTOM_CODE');
 */
export const resolveUpgradeUrl = (assistant: VybeAssistant, referralCode?: string): string => {
  const resolveUrl = assistantUpgradeUrlResolvers[assistant];
  return resolveUrl(referralCode);
};
