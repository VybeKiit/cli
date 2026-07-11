/**
 * Dev-only tooling shells (report mode + assistant chat).
 * Server gate resolves env flags, then a thin client host idle-loads the heavy
 * graphs so production visitors never download them and dev first paint stays light.
 */
import process from 'node:process';
import {
  ASSISTANT_CHAT_REFERRAL_ENV,
  resolveAssistantChatPort,
  shouldShowAssistantChat,
} from '@vybekiit/assistant-chat';
import { resolveVybeAssistant, shouldShowReportMode } from '@vybekiit/report-mode';
import { LandingDevToolsDeferred } from '@/components/LandingDevToolsDeferred';

/**
 * Whether the floating assistant chat should mount on the landing page in this
 * process. Defaults on in development unless explicitly disabled with
 * `VYBE_ASSISTANT_CHAT=0` / `false`.
 *
 * @param env - Process environment.
 * @returns True when the chat shell should load.
 * @example
 * const show = shouldShowLandingAssistantChat(process.env);
 */
const shouldShowLandingAssistantChat = (env: Record<string, string | undefined>): boolean => {
  const raw = env.VYBE_ASSISTANT_CHAT?.trim().toLowerCase();
  if (raw === '0' || raw === 'false') {
    return false;
  }
  if (shouldShowAssistantChat(env)) {
    return true;
  }
  // Landing defaults the sidebar on in local development so maintainers see it
  // without hunting for an env flag — still hard-gated by NODE_ENV in the layout.
  return env.NODE_ENV === 'development';
};

/**
 * Mounts local-dev QA tooling. Never load this module in production.
 *
 * @returns Deferred dev shell host, or null when both tools are off.
 * @example
 * {process.env.NODE_ENV === 'development' ? <LandingDevShells /> : null}
 */
export const LandingDevShells = () => {
  const showReport = shouldShowReportMode(process.env);
  const showChat = shouldShowLandingAssistantChat(process.env);

  if (!(showReport || showChat)) {
    return null;
  }

  // Prefer configured assistant; fall back so the chat launcher always has a target.
  const assistant = resolveVybeAssistant(process.env) ?? 'claude';
  const port = resolveAssistantChatPort(process.env);
  const referralCode = process.env[ASSISTANT_CHAT_REFERRAL_ENV]?.trim();

  return (
    <LandingDevToolsDeferred
      assistant={assistant}
      bridgeUrl={`http://localhost:${port}`}
      projectRoot={process.cwd()}
      showChat={showChat}
      showReport={showReport}
      {...(referralCode !== undefined && referralCode.length > 0 ? { referralCode } : {})}
    />
  );
};
