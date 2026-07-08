import { isVybeLocalDevHost } from '@vybekiit/report-mode';

import { isAssistantChatEnabled } from './config';

/**
 * Check whether the browser sidebar should mount in this environment.
 *
 * @param env - Environment source to read from.
 * @returns True when the host is local and the assistant chat flag is enabled.
 * @example
 * const visible = shouldShowAssistantChat(process.env);
 */
export const shouldShowAssistantChat = (env: Record<string, string | undefined>): boolean =>
  isVybeLocalDevHost(env) && isAssistantChatEnabled(env);
