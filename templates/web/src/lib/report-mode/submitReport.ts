'use client';

import {
  buildAssistantDeepLink,
  formatReportPrompt,
  type ReportHandoffTarget,
  type ReportPayload,
  type VybeAssistant,
} from '@vybekiit/report-mode';
import { toast } from 'sonner';

/**
 * Copy a report prompt and optionally open an assistant deeplink.
 *
 * @param options - Report payload, assistant target, and project root.
 * @returns Promise that resolves after the clipboard/deeplink action is attempted.
 * @example
 * await submitReportHandoff({ payload, assistant, projectRoot, target: 'new-chat' });
 */
export const submitReportHandoff = async (options: {
  readonly payload: ReportPayload;
  readonly assistant: VybeAssistant | null;
  readonly projectRoot: string;
  readonly target: ReportHandoffTarget;
}): Promise<void> => {
  const prompt = formatReportPrompt(options.payload);
  const openNewChat = options.target === 'new-chat' && options.assistant !== null;

  try {
    await navigator.clipboard.writeText(prompt);
  } catch {
    // Clipboard is best-effort before deeplink.
  }

  if (openNewChat) {
    const url = buildAssistantDeepLink(options.assistant, options.projectRoot, prompt);
    globalThis.location.href = url;
    toast.success('Copied — opening a new chat in your assistant.');
    return;
  }

  if (options.assistant) {
    toast.success('Copied — paste into your current chat (Cmd+V).');
    return;
  }

  toast.success('Copied — paste into your assistant.');
};
