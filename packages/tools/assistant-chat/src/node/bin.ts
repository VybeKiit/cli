#!/usr/bin/env node
import process from 'node:process';
import { isAssistantChatEnabled, resolveAssistantChatPort } from '@vybekiit/assistant-chat/config';
import { resolveVybeAssistant } from '@vybekiit/report-mode';

import { startAssistantChatBridge } from './bridge';

const assistantLabel = (assistant: ReturnType<typeof resolveVybeAssistant>): string => {
  if (assistant === null) {
    return 'none';
  }

  return assistant;
};

/**
 * Run the `assistant-chat-bridge` CLI entrypoint.
 *
 * @returns Nothing; starts the bridge server or exits when disabled.
 * @example
 * main();
 */
const main = (): void => {
  // Bridge CLI defaults on unless explicitly disabled (same contract as isAssistantChatEnabled).
  // Treat missing NODE_ENV as development so `pnpm bridge` always works for vibe coders.
  const env = {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV ?? 'development',
  };
  if (!isAssistantChatEnabled(env)) {
    process.stderr.write(
      'assistant-chat bridge disabled - set VYBE_ASSISTANT_CHAT=1 (or unset NODE_ENV) to enable.\n',
    );
    process.exit(0);
  }
  const port = resolveAssistantChatPort(env);
  const assistant = resolveVybeAssistant(process.env);
  startAssistantChatBridge({ port, assistant, cwd: process.cwd() });
  process.stdout.write(
    `assistant-chat bridge on http://localhost:${port} (assistant=${assistantLabel(assistant)})\n`,
  );
};

main();
