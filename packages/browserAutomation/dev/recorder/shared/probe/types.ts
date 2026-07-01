import type { ParsedEntry } from '../draft';

export type DomCandidate = {
  ariaLabel: string | null;
  associatedLabel: string | null;
  href: string | null;
  id: string | null;
  nearestHeading: string | null;
  placeholder: string | null;
  role: string | null;
  tag: string;
  textContent: string | null;
  type: string | null;
};

export type PageSnapshot = {
  candidates: DomCandidate[];
  hrefs: string[];
  pathname: string;
  url: string;
};

export type CrawlResult = {
  pages: PageSnapshot[];
  truncated: boolean;
  visitedCount: number;
};

export type ClassifiedMatch = {
  candidate: DomCandidate;
  entry: ParsedEntry;
  fieldKey: string;
  pageUrl: string;
};

export type ProbeReport = {
  capturedAt: string;
  crawl: CrawlResult;
  matched: Record<string, ClassifiedMatch>;
  missing: string[];
  verified: string[];
  verifyFailed: string[];
};
