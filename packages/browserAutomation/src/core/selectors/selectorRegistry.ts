/** Shared selector inventory types and staleness checks for browser-automation domains. */
export type SelectorEntry =
  | { kind: 'css'; selector: string; verifiedAt: null | string }
  | { kind: 'label'; text: RegExp | string; verifiedAt: null | string }
  | { kind: 'placeholder'; text: RegExp | string; verifiedAt: null | string }
  | { kind: 'role'; name: RegExp | string; role: string; verifiedAt: null | string };

/** Number of days a recorded selector can stay trusted before being refreshed. */
export const SELECTOR_STALENESS_DAYS = 90;

/**
 * Check whether a selector entry is still fresh.
 *
 * @param entry - Selector entry with a verification timestamp.
 * @param today - Date to compare against.
 * @returns True when the entry is verified and within the freshness window.
 * @example
 * const fresh = isSelectorFresh(entry, new Date('2026-01-01'));
 */
export const isSelectorFresh = (entry: SelectorEntry, today: Date = new Date()): boolean => {
  if (!entry.verifiedAt) {
    return false;
  }
  const verified = new Date(entry.verifiedAt);
  if (Number.isNaN(verified.getTime())) {
    return false;
  }
  const ageDays = (today.getTime() - verified.getTime()) / (1000 * 60 * 60 * 24);
  return ageDays <= SELECTOR_STALENESS_DAYS;
};

/**
 * Resolve the first fresh selector entry for a field.
 *
 * @param entries - Candidate selector entries for a field.
 * @param fieldKey - Field key used in missing-selector errors.
 * @param onMissing - Callback that throws the domain-specific missing-selector error.
 * @param today - Date to compare selector freshness against.
 * @returns The first fresh selector entry.
 * @example
 * const entry = resolveFreshSelectorEntry(entries, 'name', throwMissingSelector);
 */
export const resolveFreshSelectorEntry = (
  entries: readonly SelectorEntry[] | undefined,
  fieldKey: string,
  onMissing: (fieldKey: string, reason: 'missing' | 'stale') => never,
  today: Date = new Date(),
): SelectorEntry => {
  if (entries === undefined || entries.length === 0) {
    onMissing(fieldKey, 'missing');
  }
  const fresh = entries.find((entry) => isSelectorFresh(entry, today));
  if (!fresh) {
    onMissing(fieldKey, 'stale');
  }
  return fresh;
};
