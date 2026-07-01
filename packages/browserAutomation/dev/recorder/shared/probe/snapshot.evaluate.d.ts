import type { DomCandidate } from './types';

export type PageSnapshotEvaluateResult = {
  candidates: Array<DomCandidate & { visible: boolean }>;
  hrefs: string[];
};

export function extractPageSnapshot(): PageSnapshotEvaluateResult;
