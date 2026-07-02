import { ReportModeDev } from '@/components/report-mode/report-mode-dev';
import '@/components/report-mode/dock/styles/report-mode-dock.css';
import { TooltipProvider } from '@/components/ui/tooltip';
import { readNodeCwd, readNodeEnv } from '@/lib/nodeEnv';
import { resolveVybeAssistant } from '@vybekiit/report-mode';
import { Toaster } from 'sonner';

/** Server wrapper — reads assistant + project root for dev-only Report Mode. */
export function ReportModeDevShell() {
  const env = readNodeEnv();
  if (env.NODE_ENV !== 'development') {
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
