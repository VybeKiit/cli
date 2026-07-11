import {
  buildAssistantDeepLink,
  formatReportPrompt,
  resolveVybeAssistant,
  type ReportPayload,
} from '@vybekiit/report-mode';

const assistant = resolveVybeAssistant(import.meta.env as Record<string, string | undefined>);

/**
 * Submit an extension report through assistant deep link or clipboard fallback.
 *
 * @param payload - Report details collected from the extension report overlay.
 * @returns A promise that resolves after the handoff is prepared.
 * @example
 * await submitExtensionReport({ route: 'extension-popup', selector: 'button', builderNote: 'Wrong copy' });
 */
export const submitExtensionReport = async (payload: ReportPayload): Promise<void> => {
  const prompt = formatReportPrompt({ ...payload, platform: 'extension' });

  if (assistant) {
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      // best-effort
    }
    const url = buildAssistantDeepLink(assistant, '', prompt);
    if (url !== null) {
      window.location.href = url;
      return;
    }
  }

  await navigator.clipboard.writeText(prompt);
};

export { assistant as extensionVybeAssistant };
