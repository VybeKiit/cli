'use client';

// Web-only Report Mode React hooks (DOM). Imported by web + extension owned UI;
// the React Native mobile template never pulls this entry, so no DOM code reaches it.
export { useConsoleErrorBuffer } from './use-console-errors';
export { useInspectMode } from './use-inspect-mode';
export { useReportDockPosition } from './use-report-dock';
export { useReportDockCollapse } from './use-report-dock-collapse';
export { useReportFlyoutPosition } from './use-report-flyout-position';
export { useReportHandoffTarget } from './use-report-handoff-target';
export { useReportHoldSelect } from './use-report-hold-select';
export { useReportHotkey } from './use-report-hotkey';
export { useReportHoverMenu } from './use-report-hover-menu';
export { useReportInspectHighlightColor } from './use-report-inspect-highlight-color';
export { useReportTutorial } from './use-report-tutorial';
