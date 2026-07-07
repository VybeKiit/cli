import { REPORT_MODE_HOTKEY_LABEL } from '@vybekiit/report-mode';

/**
 * Render the amber banner shown while pick mode is active.
 *
 * @returns Fixed report-mode banner.
 * @example
 * <ReportModeBanner />
 */
const ReportModeBanner = () => (
  <div
    className="pointer-events-none fixed inset-x-0 top-0 z-[9998] bg-amber-500/90 px-4 py-2 text-center font-medium text-amber-950 text-sm"
    data-report-mode-ui={true}
    data-report-tutorial="inspect"
    data-testid="report-mode-banner"
  >
    Click what looks wrong ({REPORT_MODE_HOTKEY_LABEL} to turn off)
  </div>
);

export { ReportModeBanner };
