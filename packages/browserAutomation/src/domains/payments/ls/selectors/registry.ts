import { SelectorMissingError } from '@vybekiit/browserAutomation/core/errors';
import {
  resolveFreshSelectorEntry,
  type SelectorEntry,
} from '@vybekiit/browserAutomation/core/selectors';
import { LS_RECORDED_SELECTORS } from './registry.generated';

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
  return resolveFreshSelectorEntry(SELECTORS[fieldKey], fieldKey, today, (key, reason) => {
    throw new SelectorMissingError(key, reason);
  });
}

export type { SelectorEntry };
