'use client';

import {
  buildAssistantDeepLink,
  formatReportPrompt,
  type ReportHandoffTarget,
  type ReportPayload,
  type VybeAssistant,
} from '@vybekiit/report-mode';
import { toast } from 'sonner';

interface SubmitReportHandoffOptions {
  readonly payload: ReportPayload;
  readonly assistant: VybeAssistant | null;
  readonly projectRoot: string;
  readonly target: ReportHandoffTarget;
}

/**
 * Copy a report prompt and optionally open an assistant deep link.
 *
 * @param options - Report payload, assistant selection, project root, and target chat mode.
 * @returns A promise that resolves after copy/deeplink handling finishes.
 * @example
 * await submitReportHandoff({ payload, assistant, projectRoot, target: 'new-chat' });
 */
const submitReportHandoff = async (options: SubmitReportHandoffOptions): Promise<void> => {
  const prompt = formatReportPrompt(options.payload);
  const openNewChat = options.target === 'new-chat' && options.assistant !== null;

  try {
    await navigator.clipboard.writeText(prompt);
  } catch {
    // Clipboard is best-effort before deeplink.
  }

  if (openNewChat) {
    const url = buildAssistantDeepLink(options.assistant, options.projectRoot, prompt);
    window.location.href = url;
    toast.success('Copied — opening a new chat in your assistant.');
    return;
  }

  if (options.assistant) {
    toast.success('Copied — paste into your current chat (Cmd+V).');
    return;
  }

  toast.success('Copied — paste into your assistant.');
};

export { submitReportHandoff };
