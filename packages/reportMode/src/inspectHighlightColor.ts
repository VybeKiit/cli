/** Border color for the inspect highlight ring during pick mode. */
export const DEFAULT_INSPECT_HIGHLIGHT_COLOR = '#f59e0b';

/** Preset inspect highlight colors shown in Report Mode settings. */
export const INSPECT_HIGHLIGHT_PRESETS = [
  '#f59e0b',
  '#3b82f6',
  '#22c55e',
  '#ec4899',
  '#a855f7',
  '#ef4444',
] as const;

/** Browser storage key for the inspect highlight color. */
export const REPORT_INSPECT_HIGHLIGHT_COLOR_STORAGE_KEY = 'vybekiit-report-inspect-highlight-color';

// #3b82f6 -> match; blue -> no match
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

/**
 * Check whether a string is a six-digit hex color.
 *
 * @param value - Candidate color string.
 * @returns `true` when the value is `#RRGGBB`.
 * @example
 * const valid = isValidInspectHighlightColor('#3b82f6');
 */
export const isValidInspectHighlightColor = (value: string): boolean =>
  HEX_COLOR_PATTERN.test(value);

/**
 * Normalize an inspect highlight color.
 *
 * @param value - Candidate color string.
 * @returns Lowercase `#RRGGBB`, or `null` when invalid.
 * @example
 * const color = normalizeInspectHighlightColor('#3B82F6');
 */
export const normalizeInspectHighlightColor = (value: string): string | null => {
  const trimmed = value.trim();
  if (!isValidInspectHighlightColor(trimmed)) {
    return null;
  }
  return trimmed.toLowerCase();
};

/**
 * Load the persisted inspect highlight color.
 *
 * @param storage - Browser storage or `null` when unavailable.
 * @returns The stored color, or the default inspect highlight color.
 * @example
 * const color = loadInspectHighlightColor(localStorage);
 */
export const loadInspectHighlightColor = (storage: Storage | null): string => {
  if (storage === null) {
    return DEFAULT_INSPECT_HIGHLIGHT_COLOR;
  }
  try {
    const raw = storage.getItem(REPORT_INSPECT_HIGHLIGHT_COLOR_STORAGE_KEY);
    if (raw !== null) {
      const normalized = normalizeInspectHighlightColor(raw);
      if (normalized !== null) {
        return normalized;
      }
    }
  } catch {
    // ignore quota / private mode
  }
  return DEFAULT_INSPECT_HIGHLIGHT_COLOR;
};

/**
 * Persist the inspect highlight color when it is valid.
 *
 * @param storage - Browser storage or `null` when unavailable.
 * @param color - Candidate color selected by the user.
 * @returns Nothing.
 * @example
 * saveInspectHighlightColor(localStorage, '#3b82f6');
 */
export const saveInspectHighlightColor = (storage: Storage | null, color: string): void => {
  if (storage === null) {
    return;
  }
  const normalized = normalizeInspectHighlightColor(color);
  if (normalized === null) {
    return;
  }
  try {
    storage.setItem(REPORT_INSPECT_HIGHLIGHT_COLOR_STORAGE_KEY, normalized);
  } catch {
    // ignore
  }
};

/**
 * Convert a hex color to an rgba() string for the highlight fill.
 *
 * @param hex - Candidate `#RRGGBB` color.
 * @param alpha - Alpha channel from 0 to 1.
 * @returns CSS rgba color string.
 * @example
 * const fill = hexToRgba('#f59e0b', 0.2);
 */
export const hexToRgba = (hex: string, alpha: number): string => {
  const normalized = normalizeInspectHighlightColor(hex);
  const color = normalized === null ? DEFAULT_INSPECT_HIGHLIGHT_COLOR : normalized;
  const r = Number.parseInt(color.slice(1, 3), 16);
  const g = Number.parseInt(color.slice(3, 5), 16);
  const b = Number.parseInt(color.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
