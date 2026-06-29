import { SelectorMissingError } from '../../../../core/errors';
import type { SelectorEntry } from '../../../extension/selectors';
import { LS_RECORDED_SELECTORS } from './registry.generated';

const SELECTOR_STALENESS_DAYS = 90;

const DEFAULT_SELECTORS: Record<string, SelectorEntry[]> = {};

const SELECTORS: Record<string, SelectorEntry[]> = {
  ...DEFAULT_SELECTORS,
  ...LS_RECORDED_SELECTORS,
};

export function resolveLsSelector(fieldKey: string): SelectorEntry[] {
  const entries = SELECTORS[fieldKey];
  if (!entries || entries.length === 0) {
    throw new SelectorMissingError(fieldKey, 'missing');
  }
  return entries;
}

export function resolveLsSelectorEntry(fieldKey: string, today: Date = new Date()): SelectorEntry {
  const entries = resolveLsSelector(fieldKey);
  const fresh = entries.find((entry) => isFresh(entry, today));
  if (!fresh) throw new SelectorMissingError(fieldKey, 'stale');
  return fresh;
}

function isFresh(entry: SelectorEntry, today: Date): boolean {
  if (!entry.verifiedAt) return false;
  const verified = new Date(entry.verifiedAt);
  if (Number.isNaN(verified.getTime())) return false;
  const ageDays = (today.getTime() - verified.getTime()) / (1000 * 60 * 60 * 24);
  return ageDays <= SELECTOR_STALENESS_DAYS;
}

export type { SelectorEntry };
