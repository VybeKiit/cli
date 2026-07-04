import { isVybeLocalDevHost } from '@vybekiit/report-mode';

/**
 * Shared knobs for the dev bridge. The env var names are the single source of truth
 * for both the Node bridge and the browser UI, so turning the tool on is one flag.
 */

/** Feature flag — the tool renders and the bridge starts only when this is truthy. */
export const ASSISTANT_CHAT_ENABLED_ENV = 'VYBE_ASSISTANT_CHAT';
/** Optional port override for the bridge (public so the UI can read the same value). */
export const ASSISTANT_CHAT_PORT_ENV = 'NEXT_PUBLIC_VYBE_ASSISTANT_CHAT_PORT';
/** Optional Cursor referral code appended to the upgrade link when the active agent is Cursor. */
export const ASSISTANT_CHAT_REFERRAL_ENV = 'NEXT_PUBLIC_VYBE_CURSOR_REFERRAL';

/** Default bridge port — high, unlikely to collide with dev servers. */
export const DEFAULT_ASSISTANT_CHAT_PORT = 4319;

/** True when the env flag opts the dev tool in. */
export function isAssistantChatEnabled(env: Record<string, string | undefined>): boolean {
  const raw = env[ASSISTANT_CHAT_ENABLED_ENV]?.trim().toLowerCase();
  return raw === '1' || raw === 'true';
}

/** True when the dev sidebar should mount (local host + opt-in flag). */
export function shouldShowAssistantChat(env: Record<string, string | undefined>): boolean {
  return isVybeLocalDevHost(env) && isAssistantChatEnabled(env);
}

/** Resolve the bridge port from env, falling back to the default. */
export function resolveAssistantChatPort(env: Record<string, string | undefined>): number {
  const raw = env[ASSISTANT_CHAT_PORT_ENV]?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_ASSISTANT_CHAT_PORT;
}
