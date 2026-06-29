import { ReportModeDev } from '@/components/report-mode/report-mode-dev';
import { resolveVybeAssistant } from '@vybekiit/report-mode';
import process from 'node:process';

/** Server wrapper — reads assistant + project root for dev-only Report Mode. */
export function ReportModeDevShell() {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const assistant = resolveVybeAssistant(process.env);
  const projectRoot = process.cwd();

  return <ReportModeDev assistant={assistant} projectRoot={projectRoot} />;
}
