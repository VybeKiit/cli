import { ReportModeDev } from '@/components/report-mode/report-mode-dev';
import '@/components/report-mode/dock/styles/report-mode-dock.css';
import { TooltipProvider } from '@vybekiit/ui/tooltip';
import { readNodeCwd, readNodeEnv } from '@/lib/nodeEnv';
import { resolveVybeAssistant, shouldShowReportMode } from '@vybekiit/report-mode';
import { Toaster } from 'sonner';

/** Server wrapper — reads assistant + project root for dev-only Report Mode. */
export function ReportModeDevShell() {
  const env = readNodeEnv();
  if (!shouldShowReportMode(env)) {
    return null;
  }

  const assistant = resolveVybeAssistant(env);
  const projectRoot = readNodeCwd();

  return (
    <TooltipProvider delayDuration={500} skipDelayDuration={0}>
      <Toaster position="bottom-center" richColors={true} />
      <ReportModeDev assistant={assistant} projectRoot={projectRoot} />
    </TooltipProvider>
  );
}
