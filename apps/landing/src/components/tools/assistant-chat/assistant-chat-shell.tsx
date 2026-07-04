import process from 'node:process';
import {
  ASSISTANT_CHAT_REFERRAL_ENV,
  resolveAssistantChatPort,
  shouldShowAssistantChat,
} from '@vybekiit/assistant-chat';
import { resolveVybeAssistant } from '@vybekiit/report-mode';
import { AssistantChatLauncher } from './assistant-chat-launcher';

/**
 * Dev-only mount for the vibe-coder chat tool. Renders nothing in production and
 * nothing unless VYBE_ASSISTANT_CHAT is on and an assistant is resolved — the bridge
 * must be running separately (`pnpm --filter @vybekiit/assistant-chat bridge`).
 */
export function AssistantChatDevShell() {
  if (!shouldShowAssistantChat(process.env)) {
    return null;
  }

  const assistant = resolveVybeAssistant(process.env);
  if (!assistant) {
    return null;
  }

  const port = resolveAssistantChatPort(process.env);
  const referralCode = process.env[ASSISTANT_CHAT_REFERRAL_ENV]?.trim();

  return (
    <AssistantChatLauncher
      assistant={assistant}
      bridgeUrl={`http://localhost:${port}`}
      {...(referralCode ? { referralCode } : {})}
    />
  );
}
