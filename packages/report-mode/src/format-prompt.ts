import { REPORT_PROMPT_PREFIX, type ReportPayload } from './types';

/**
 * Format a structured report as a prompt the assistant pre-fills via deeplink.
 * The `[VybeKiit Report]` prefix tells doctor.md to skip the reproduce question.
 */
export function formatReportPrompt(payload: ReportPayload): string {
  const lines = [
    REPORT_PROMPT_PREFIX,
    '',
    `Platform: ${payload.platform ?? 'web'}`,
    `Route: ${payload.route}`,
    `Element selector: ${payload.selector}`,
  ];

  if (payload.a11yName) {
    lines.push(`Accessible name: ${payload.a11yName}`);
  }
  if (payload.visibleText) {
    lines.push(`Visible text: ${payload.visibleText.slice(0, 200)}`);
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
}
