/** Border color for the inspect highlight ring during pick mode. */
export const DEFAULT_INSPECT_HIGHLIGHT_COLOR = '#f59e0b';

export const INSPECT_HIGHLIGHT_PRESETS = [
  '#f59e0b',
  '#3b82f6',
  '#22c55e',
  '#ec4899',
  '#a855f7',
  '#ef4444',
] as const;

export const REPORT_INSPECT_HIGHLIGHT_COLOR_STORAGE_KEY = 'vybekiit-report-inspect-highlight-color';

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

export function isValidInspectHighlightColor(value: string): boolean {
  return HEX_COLOR_PATTERN.test(value);
}

export function normalizeInspectHighlightColor(value: string): string | null {
  const trimmed = value.trim();
  if (!isValidInspectHighlightColor(trimmed)) {
    return null;
  }
  return trimmed.toLowerCase();
}

export function loadInspectHighlightColor(storage: Storage | null): string {
  if (!storage) {
    return DEFAULT_INSPECT_HIGHLIGHT_COLOR;
  }
  try {
    const raw = storage.getItem(REPORT_INSPECT_HIGHLIGHT_COLOR_STORAGE_KEY);
    if (raw) {
      const normalized = normalizeInspectHighlightColor(raw);
      if (normalized) {
        return normalized;
      }
    }
  } catch {
    // ignore quota / private mode
  }
  return DEFAULT_INSPECT_HIGHLIGHT_COLOR;
}

export function saveInspectHighlightColor(storage: Storage | null, color: string): void {
  if (!storage) {
    return;
  }
  const normalized = normalizeInspectHighlightColor(color);
  if (!normalized) {
    return;
  }
  try {
    storage.setItem(REPORT_INSPECT_HIGHLIGHT_COLOR_STORAGE_KEY, normalized);
  } catch {
    // ignore
  }
}

/** Converts #RRGGBB to rgba() for the highlight fill. */
export function hexToRgba(hex: string, alpha: number): string {
  const normalized = normalizeInspectHighlightColor(hex) ?? DEFAULT_INSPECT_HIGHLIGHT_COLOR;
  const r = Number.parseInt(normalized.slice(1, 3), 16);
  const g = Number.parseInt(normalized.slice(3, 5), 16);
  const b = Number.parseInt(normalized.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
