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
/** Codex has no referral program — plain pricing page. */
const CODEX_PRICING_URL = 'https://openai.com/chatgpt/pricing';

/** Resolve the upgrade URL for an assistant; `referralCode` overrides the Cursor code. */
export function resolveUpgradeUrl(assistant: VybeAssistant, referralCode?: string): string {
  switch (assistant) {
    case 'cursor': {
      const url = new URL('https://cursor.com/referral');
      url.searchParams.set('code', referralCode ?? CURSOR_REFERRAL_DEFAULT);
      return url.toString();
    }
    case 'claude':
      return CLAUDE_REFERRAL_URL;
    case 'codex':
      return CODEX_PRICING_URL;
  }
}
