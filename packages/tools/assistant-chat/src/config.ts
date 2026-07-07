/**
 * Shared knobs for the dev bridge. The env var names are the single source of truth
 * for both the Node bridge and the browser UI, so turning the tool on is one flag.
 */

/** Feature flag that lets the tool render and the bridge start. */
export const ASSISTANT_CHAT_ENABLED_ENV = 'VYBE_ASSISTANT_CHAT';
/** Optional port override for the bridge (public so the UI can read the same value). */
export const ASSISTANT_CHAT_PORT_ENV = 'NEXT_PUBLIC_VYBE_ASSISTANT_CHAT_PORT';
/** Optional Cursor referral code appended to the upgrade link when the active agent is Cursor. */
export const ASSISTANT_CHAT_REFERRAL_ENV = 'NEXT_PUBLIC_VYBE_CURSOR_REFERRAL';

/** Default bridge port, high enough to avoid most dev server collisions. */
export const DEFAULT_ASSISTANT_CHAT_PORT = 4319;

const readTrimmedEnvValue = (
  env: Record<string, string | undefined>,
  key: string,
): string | undefined => {
  const value = env[key];

  if (typeof value !== 'string') {
    return;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return;
  }

  return trimmed;
};

/**
 * Check whether the assistant chat env flag opts the dev tool in.
 *
 * @param env - Environment source to read from.
 * @returns True when `VYBE_ASSISTANT_CHAT` is `1` or `true`.
 * @example
 * const enabled = isAssistantChatEnabled(process.env);
 */
export const isAssistantChatEnabled = (env: Record<string, string | undefined>): boolean => {
  const raw = readTrimmedEnvValue(env, ASSISTANT_CHAT_ENABLED_ENV)?.toLowerCase();
  return raw === '1' || raw === 'true';
};

/**
 * Resolve the assistant chat bridge port from env.
 *
 * @param env - Environment source to read from.
 * @returns A positive integer port, or the package default when the env value is absent or invalid.
 * @example
 * const port = resolveAssistantChatPort(process.env);
 */
export const resolveAssistantChatPort = (env: Record<string, string | undefined>): number => {
  const raw = readTrimmedEnvValue(env, ASSISTANT_CHAT_PORT_ENV);

  if (typeof raw !== 'string') {
    return DEFAULT_ASSISTANT_CHAT_PORT;
  }

  const parsed = Number.parseInt(raw, 10);

  if (Number.isInteger(parsed) && parsed > 0) {
    return parsed;
  }

  return DEFAULT_ASSISTANT_CHAT_PORT;
};
