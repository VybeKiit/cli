import { REPORT_PROMPT_PREFIX, type ReportPayload, type ReportPlatform } from './types';

/**
 * Resolve the platform label included in report prompts.
 *
 * @param platform - Optional platform captured by the reporter.
 * @returns The captured platform, or the web default for browser reports.
 * @example
 * const platform = resolveReportPlatform(undefined);
 */
const resolveReportPlatform = (platform: ReportPlatform | undefined): ReportPlatform => {
  if (platform !== undefined) {
    return platform;
  }

  return 'web';
};

/**
 * Format a structured report as a prompt the assistant pre-fills via deeplink.
 *
 * @param payload - Structured report payload captured by Report Mode.
 * @returns A prompt string prefixed for the buyer-facing doctor flow.
 * @example
 * const prompt = formatReportPrompt(payload);
 */
export const formatReportPrompt = (payload: ReportPayload): string => {
  const lines = [
    REPORT_PROMPT_PREFIX,
    '',
    `Platform: ${resolveReportPlatform(payload.platform)}`,
    `Page: ${payload.route}`,
    `Location in code: ${payload.selector}`,
  ];

  if (payload.spotLabel) {
    lines.push(`Spot on page: ${payload.spotLabel}`);
  }
  if (payload.a11yName) {
    lines.push(`What they clicked (label): ${payload.a11yName}`);
  }
  if (payload.visibleText) {
    lines.push(`Visible text on screen: ${payload.visibleText.slice(0, 200)}`);
  }
  if (payload.consoleErrors.length > 0) {
    lines.push('', 'Recent console errors:');
    for (const err of payload.consoleErrors) {
      lines.push(`- ${err.slice(0, 500)}`);
    }
  }
  lines.push('', `Builder note: ${payload.builderNote}`);
  lines.push('', 'Fix the smallest thing that addresses this. Verify it works.');

  return lines.join('\n');
};
