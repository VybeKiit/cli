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
 * Mounts local-dev QA tooling. Never load this module in production.
 *
 * @returns Deferred dev shell host, or null when both tools are off.
 * @example
 * {process.env.NODE_ENV === 'development' ? <LandingDevShells /> : null}
 */
export const LandingDevShells = () => {
  const showReport = shouldShowReportMode(process.env);
  const showChat = shouldShowAssistantChat(process.env);

  if (!(showReport || showChat)) {
    return null;
  }

  const assistant = resolveVybeAssistant(process.env);
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
