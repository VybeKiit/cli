'use client';

import {
  buildAssistantDeepLink,
  formatReportPrompt,
  type ReportPayload,
  type VybeAssistant,
} from '@vybekiit/report-mode';
import { toast } from 'sonner';

/** Open native assistant deeplink; clipboard is the fallback when assistant is unset. */
export async function submitReportHandoff(options: {
  readonly payload: ReportPayload;
  readonly assistant: VybeAssistant | null;
  readonly projectRoot: string;
}): Promise<void> {
  const prompt = formatReportPrompt(options.payload);

  if (options.assistant) {
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      // Clipboard is best-effort before deeplink.
    }
    const url = buildAssistantDeepLink(options.assistant, options.projectRoot, prompt);
    window.location.href = url;
    toast.success('I sent that to your assistant — confirm send there.');
    return;
  }

  try {
    await navigator.clipboard.writeText(prompt);
    toast.success('I copied what to tell me — paste it into your assistant.');
  } catch {
    toast.error('Could not copy the report — tell me what looks wrong in your own words.');
  }
}
