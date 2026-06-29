/** Where Report Mode sends the structured prompt after Send. */
export type ReportHandoffTarget = 'current-chat' | 'new-chat';

export const DEFAULT_REPORT_HANDOFF_TARGET: ReportHandoffTarget = 'current-chat';

export const REPORT_HANDOFF_TARGET_LABELS: Record<ReportHandoffTarget, string> = {
  'current-chat': 'This chat',
  'new-chat': 'New chat',
};

export const REPORT_HANDOFF_TARGET_STORAGE_KEY = 'vybekiit-report-handoff-target';

const VALID_TARGETS: readonly ReportHandoffTarget[] = ['current-chat', 'new-chat'];

export function loadReportHandoffTarget(storage: Storage | null): ReportHandoffTarget {
  if (!storage) {
    return DEFAULT_REPORT_HANDOFF_TARGET;
  }
  try {
    const raw = storage.getItem(REPORT_HANDOFF_TARGET_STORAGE_KEY);
    if (raw && VALID_TARGETS.includes(raw as ReportHandoffTarget)) {
      return raw as ReportHandoffTarget;
    }
  } catch {
    // ignore quota / private mode
  }
  return DEFAULT_REPORT_HANDOFF_TARGET;
}

export function saveReportHandoffTarget(
  storage: Storage | null,
  target: ReportHandoffTarget,
): void {
  if (!storage) {
    return;
  }
  try {
    storage.setItem(REPORT_HANDOFF_TARGET_STORAGE_KEY, target);
  } catch {
    // ignore
  }
}
