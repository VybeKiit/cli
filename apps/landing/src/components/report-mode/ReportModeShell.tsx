import { ReportModeDev } from '@/components/report-mode/ReportModeDev';
import '@/components/report-mode/dock/styles/report-mode-dock.css';
import process from 'node:process';
import { resolveVybeAssistant, shouldShowReportMode } from '@vybekiit/report-mode';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

/**
 * Dev-only Report Mode for landing QA — structured prompts back to your assistant.
 *
 * @returns The rendered ReportModeDevShell element.
 * @example
 * ```tsx
 * <ReportModeDevShell />
 * ```
 */

export const ReportModeDevShell = () => {
  if (!shouldShowReportMode(process.env)) {
    return null;
  }

  const assistant = resolveVybeAssistant(process.env);
  const projectRoot = process.cwd();

  return (
    <TooltipProvider delayDuration={500} skipDelayDuration={0}>
      <Toaster position="bottom-center" richColors={true} />
      <ReportModeDev assistant={assistant} projectRoot={projectRoot} />
    </TooltipProvider>
  );
};
