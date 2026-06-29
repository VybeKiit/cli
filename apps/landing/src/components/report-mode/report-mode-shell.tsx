import { ReportModeDev } from '@/components/report-mode/report-mode-dev';
import '@/components/report-mode/dock/styles/report-mode-dock.css';
import { TooltipProvider } from '@/components/ui/tooltip';
import { resolveVybeAssistant } from '@vybekiit/report-mode';
import process from 'node:process';
import { Toaster } from 'sonner';

/** Dev-only Report Mode for landing QA — structured prompts back to your assistant. */
export function ReportModeDevShell() {
  if (process.env.NODE_ENV !== 'development') {
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
}
