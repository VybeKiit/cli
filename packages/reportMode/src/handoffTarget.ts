/** Where Report Mode sends the structured prompt after Send. */
export type ReportHandoffTarget = 'current-chat' | 'new-chat';

/** Default handoff behavior for first-time Report Mode users. */
export const DEFAULT_REPORT_HANDOFF_TARGET: ReportHandoffTarget = 'current-chat';

/** Labels shown for handoff target choices. */
export const REPORT_HANDOFF_TARGET_LABELS: Record<ReportHandoffTarget, string> = {
  'current-chat': 'This chat',
  'new-chat': 'New chat',
};

/** Browser storage key for the Report Mode handoff target. */
export const REPORT_HANDOFF_TARGET_STORAGE_KEY = 'vybekiit-report-handoff-target';

const VALID_TARGETS: readonly ReportHandoffTarget[] = ['current-chat', 'new-chat'];

/**
 * Check whether a stored value is a valid handoff target.
 *
 * @param value - Raw value read from browser storage.
 * @returns `true` when the value is a supported target.
 * @example
 * const valid = isReportHandoffTarget('current-chat');
 */
const isReportHandoffTarget = (value: string): value is ReportHandoffTarget =>
  VALID_TARGETS.includes(value as ReportHandoffTarget);

/**
 * Load the persisted Report Mode handoff target.
 *
 * @param storage - Browser storage or `null` when unavailable.
 * @returns The stored target, or the default target when storage is empty or invalid.
 * @example
 * const target = loadReportHandoffTarget(localStorage);
 */
export const loadReportHandoffTarget = (storage: Storage | null): ReportHandoffTarget => {
  if (storage === null) {
    return DEFAULT_REPORT_HANDOFF_TARGET;
  }
  try {
    const raw = storage.getItem(REPORT_HANDOFF_TARGET_STORAGE_KEY);
    if (raw !== null && isReportHandoffTarget(raw)) {
      return raw;
    }
  } catch {
    // ignore quota / private mode
  }
  return DEFAULT_REPORT_HANDOFF_TARGET;
};

/**
 * Persist the Report Mode handoff target.
 *
 * @param storage - Browser storage or `null` when unavailable.
 * @param target - Handoff target selected by the user.
 * @returns Nothing.
 * @example
 * saveReportHandoffTarget(localStorage, 'new-chat');
 */
export const saveReportHandoffTarget = (
  storage: Storage | null,
  target: ReportHandoffTarget,
): void => {
  if (storage === null) {
    return;
  }
  try {
    storage.setItem(REPORT_HANDOFF_TARGET_STORAGE_KEY, target);
  } catch {
    // ignore
  }
};
