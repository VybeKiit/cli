import {
  buildAssistantDeepLink,
  formatReportPrompt,
  resolveVybeAssistant,
  type ReportPayload,
} from '@vybekiit/report-mode';

const assistant = resolveVybeAssistant(import.meta.env as Record<string, string | undefined>);

export async function submitExtensionReport(payload: ReportPayload): Promise<void> {
  const prompt = formatReportPrompt({ ...payload, platform: 'extension' });

  if (assistant) {
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      // best-effort
    }
    const url = buildAssistantDeepLink(assistant, '', prompt);
    window.location.href = url;
    return;
  }

  await navigator.clipboard.writeText(prompt);
}

export { assistant as extensionVybeAssistant };
