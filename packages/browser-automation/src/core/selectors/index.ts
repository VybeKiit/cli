/** Shared selector inventory types and staleness checks for browser-automation domains. */

export type SelectorEntry =
  | { kind: 'css'; selector: string; verifiedAt: null | string }
  | { kind: 'label'; text: RegExp | string; verifiedAt: null | string }
  | { kind: 'placeholder'; text: RegExp | string; verifiedAt: null | string }
  | { kind: 'role'; name: RegExp | string; role: string; verifiedAt: null | string };

export const SELECTOR_STALENESS_DAYS = 90;

export function isSelectorFresh(entry: SelectorEntry, today: Date = new Date()): boolean {
  if (!entry.verifiedAt) return false;
  const verified = new Date(entry.verifiedAt);
  if (Number.isNaN(verified.getTime())) return false;
  const ageDays = (today.getTime() - verified.getTime()) / (1000 * 60 * 60 * 24);
  return ageDays <= SELECTOR_STALENESS_DAYS;
}

export function resolveFreshSelectorEntry(
  entries: readonly SelectorEntry[] | undefined,
  fieldKey: string,
  today: Date = new Date(),
  onMissing: (fieldKey: string, reason: 'missing' | 'stale') => never,
): SelectorEntry {
  if (!entries || entries.length === 0) {
    onMissing(fieldKey, 'missing');
  }
  const fresh = entries.find((entry) => isSelectorFresh(entry, today));
  if (!fresh) onMissing(fieldKey, 'stale');
  return fresh;
}
