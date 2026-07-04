#!/usr/bin/env node
import process from 'node:process';
import { resolveVybeAssistant } from '@vybekiit/report-mode';
import { isAssistantChatEnabled, resolveAssistantChatPort } from '../config';
import { startAssistantChatBridge } from './bridge';

/** CLI entry: `assistant-chat-bridge`. Dev-only; refuses to run unless the flag is set. */
function main(): void {
  if (!isAssistantChatEnabled(process.env)) {
    process.stderr.write('assistant-chat bridge disabled — set VYBE_ASSISTANT_CHAT=1 to enable.\n');
    process.exit(0);
  }
  const port = resolveAssistantChatPort(process.env);
  const assistant = resolveVybeAssistant(process.env);
  startAssistantChatBridge({ port, assistant, cwd: process.cwd() });
  process.stdout.write(
    `assistant-chat bridge on http://localhost:${port} (assistant=${assistant ?? 'none'})\n`,
  );
}

main();
