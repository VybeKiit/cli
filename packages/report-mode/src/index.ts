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
