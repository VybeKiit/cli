const MIN_LABEL_LENGTH = 2;
const MAX_LABEL_LENGTH = 80;
const REPORT_MODE_UI_SELECTOR = '[data-report-mode-ui]';

/** Collapse whitespace for label comparison. */
export function normalizeLabelText(text: string): string {
  // collapse any whitespace run to one space: "a   b" → "a b"
  return text.replace(/\s+/g, ' ').trim();
}

/** Build a stable CSS selector path for an element (dev-only Report Mode). */
export function getCssPath(element: Element): string {
  const segments: string[] = [];
  let current: Element | null = element;

  while (current && current.tagName.toLowerCase() !== 'html') {
    let segment = current.tagName.toLowerCase();
    if (current.id) {
      segment += `#${CSS.escape(current.id)}`;
      segments.unshift(segment);
      break;
    }
    const parent: Element | null = current.parentElement;
    if (parent) {
      const sameTag = Array.from(parent.children).filter(
        (child): child is Element => child instanceof Element && child.tagName === current?.tagName,
      );
      if (sameTag.length > 1) {
        const index = sameTag.indexOf(current) + 1;
        segment += `:nth-of-type(${index})`;
      }
    }
    segments.unshift(segment);
    current = parent;
  }

  return segments.join(' > ');
}

/** Best-effort accessible name for a DOM element. */
export function getAccessibleName(element: Element): string | undefined {
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const label = document.getElementById(labelledBy);
    if (label?.textContent?.trim()) {
      return label.textContent.trim();
    }
  }
  const ariaLabel = element.getAttribute('aria-label')?.trim();
  if (ariaLabel) {
    return ariaLabel;
  }
  const text = element.textContent?.trim();
  return text && text.length > 0 ? text.slice(0, 120) : undefined;
}

/** Visible inner text, trimmed and capped. */
export function getVisibleText(element: Element): string | undefined {
  // collapse any whitespace run to one space: "a   b" → "a b"
  const text = element.textContent?.replace(/\s+/g, ' ').trim();
  if (!text) {
    return;
  }
  return text.slice(0, 200);
}

function isReportModeUi(element: Element): boolean {
  return element.closest(REPORT_MODE_UI_SELECTOR) !== null;
}

function clipLabel(text: string): string | undefined {
  const normalized = normalizeLabelText(text);
  if (normalized.length < MIN_LABEL_LENGTH) {
    return;
  }
  return normalized.length <= MAX_LABEL_LENGTH ? normalized : normalized.slice(0, MAX_LABEL_LENGTH);
}

function addCandidate(candidates: Set<string>, text: string | null | undefined): void {
  const clipped = text ? clipLabel(text) : undefined;
  if (clipped) {
    candidates.add(clipped);
  }
}

function collectDeepTextCandidates(element: Element, candidates: Set<string>): void {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const texts: string[] = [];

  while (walker.nextNode()) {
    const clipped = clipLabel(walker.currentNode.textContent ?? '');
    if (clipped) {
      texts.push(clipped);
    }
  }

  texts.sort((left, right) => left.length - right.length);
  for (const text of texts) {
    candidates.add(text);
  }
}

function collectDirectCandidates(element: Element, candidates: Set<string>): void {
  addCandidate(candidates, element.getAttribute('aria-label'));

  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    addCandidate(candidates, document.getElementById(labelledBy)?.textContent);
  }

  addCandidate(candidates, element.getAttribute('placeholder'));

  if (element instanceof HTMLImageElement) {
    addCandidate(candidates, element.alt);
  }

  // heading element? matches tag "H1".."H6", not "DIV"
  if (/^H[1-6]$/i.test(element.tagName)) {
    addCandidate(candidates, element.textContent);
  }
}

function sortCandidates(candidates: Set<string>): string[] {
  return [...candidates].sort((left, right) => left.length - right.length);
}

/** Closest-first tiers: clicked subtree, then each ancestor (no distant heading leaks). */
function collectCandidatesInTiers(element: Element): string[][] {
  const tiers: string[][] = [];

  const subtree = new Set<string>();
  collectDirectCandidates(element, subtree);
  collectDeepTextCandidates(element, subtree);
  addCandidate(subtree, element.textContent);
  tiers.push(sortCandidates(subtree));

  let parent: Element | null = element.parentElement;
  while (parent && parent.tagName.toLowerCase() !== 'body') {
    const tier = new Set<string>();
    collectDirectCandidates(parent, tier);
    tiers.push(sortCandidates(tier));
    parent = parent.parentElement;
  }

  return tiers;
}

/** Count page elements whose normalized text exactly matches (ignoring report-mode UI). */
export function countElementsWithExactLabel(text: string): number {
  const normalized = normalizeLabelText(text);
  if (!normalized) {
    return 0;
  }

  let count = 0;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);

  while (walker.nextNode()) {
    const element = walker.currentNode as Element;
    if (isReportModeUi(element)) {
      continue;
    }
    if (normalizeLabelText(element.textContent ?? '') === normalized) {
      count += 1;
    }
  }

  return count;
}

/**
 * Shortest readable label that uniquely identifies the clicked spot on the page.
 * Prefers labels from the clicked element's subtree before walking up the parent chain.
 */
export function getShortestUniqueLabel(element: Element): string {
  const tiers = collectCandidatesInTiers(element);

  for (const candidates of tiers) {
    for (const candidate of candidates) {
      if (countElementsWithExactLabel(candidate) === 1) {
        return candidate;
      }
    }
  }

  for (const candidates of tiers) {
    const shortest = candidates[0];
    if (shortest) {
      return shortest;
    }
  }

  const accessible = getAccessibleName(element);
  if (accessible) {
    const clipped = clipLabel(accessible);
    if (clipped) {
      return clipped;
    }
  }

  const visible = getVisibleText(element);
  if (visible) {
    const clipped = clipLabel(visible);
    if (clipped) {
      return clipped;
    }
  }

  return element.tagName.toLowerCase();
}
