export {
  ConsoleErrorBuffer,
  REPORT_MODE_HOTKEY_LABEL,
  REPORT_PROMPT_PREFIX,
  type ReportPayload,
  type ReportPlatform,
  type VybeAssistant,
} from './types';
export { formatReportPrompt } from './format-prompt';
export {
  buildAssistantDeepLink,
  inferVybeAssistant,
  resolveVybeAssistant,
} from './deeplink';
export {
  DEFAULT_REPORT_HANDOFF_TARGET,
  loadReportHandoffTarget,
  REPORT_HANDOFF_TARGET_LABELS,
  REPORT_HANDOFF_TARGET_STORAGE_KEY,
  saveReportHandoffTarget,
  type ReportHandoffTarget,
} from './handoff-target';
export {
  DEFAULT_INSPECT_HIGHLIGHT_COLOR,
  hexToRgba,
  INSPECT_HIGHLIGHT_PRESETS,
  isValidInspectHighlightColor,
  loadInspectHighlightColor,
  normalizeInspectHighlightColor,
  REPORT_INSPECT_HIGHLIGHT_COLOR_STORAGE_KEY,
  saveInspectHighlightColor,
} from './inspect-highlight-color';
export {
  DOCK_CORNER_LABELS,
  DOCK_CORNER_PRESETS,
  DEFAULT_DOCK_POSITION,
  REPORT_DOCK_STORAGE_KEY,
  getDockInsetStyle,
  getDockPlacementStyle,
  loadDockCornerOnly,
  loadDockPosition,
  saveDockPosition,
  snapDockToNearestCorner,
  type DockInsetStyle,
  type DockPlacementStyle,
  type DockPositionStorage,
  type ReportDockAnchor,
  type ReportDockPosition,
} from './position';
