const MIN_LABEL_LENGTH = 2;
const MAX_LABEL_LENGTH = 80;
const REPORT_MODE_UI_SELECTOR = '[data-report-mode-ui]';
// collapse any whitespace run to one space: "a   b" -> "a b"
const WHITESPACE_PATTERN = /\s+/g;
// heading element? matches tag "H1".."H6", not "DIV"
const HEADING_TAG_PATTERN = /^H[1-6]$/i;

/**
 * Collapse whitespace for report label comparison.
 *
 * @param text - Raw DOM text content.
 * @returns Trimmed text with internal whitespace collapsed to one space.
 * @example
 * normalizeLabelText('Save   changes');
 */
const normalizeLabelText = (text: string): string => text.replace(WHITESPACE_PATTERN, ' ').trim();

/**
 * Build a stable CSS selector path for an element.
 *
 * @param element - DOM element selected in dev-only Report Mode.
 * @returns A CSS-ish path that points to the element for assistant context.
 * @example
 * const path = getCssPath(button);
 */
const getCssPath = (element: Element): string => {
  const segments: string[] = [];
  let current: Element | null = element;

  while (current && current.tagName.toLowerCase() !== 'html') {
    const currentTagName = current.tagName;
    let segment = currentTagName.toLowerCase();
    if (current.id) {
      segment += `#${CSS.escape(current.id)}`;
      segments.unshift(segment);
      break;
    }
    const parent: Element | null = current.parentElement;
    if (parent) {
      const sameTag = Array.from(parent.children).filter(
        (child): child is Element => child instanceof Element && child.tagName === currentTagName,
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
};

/**
 * Read the best-effort accessible name for a DOM element.
 *
 * @param element - DOM element selected in dev-only Report Mode.
 * @returns Accessible label text when the element exposes one.
 * @example
 * const label = getAccessibleName(button);
 */
const getAccessibleName = (element: Element): string | undefined => {
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
};

/**
 * Read visible inner text for a selected DOM element.
 *
 * @param element - DOM element selected in dev-only Report Mode.
 * @returns Trimmed visible text capped for assistant prompts, when present.
 * @example
 * const text = getVisibleText(card);
 */
const getVisibleText = (element: Element): string | undefined => {
  const rawText = element.textContent;
  const text = rawText ? rawText.replace(WHITESPACE_PATTERN, ' ').trim() : '';
  if (!text) {
    return;
  }
  return text.slice(0, 200);
};

const isReportModeUi = (element: Element): boolean =>
  element.closest(REPORT_MODE_UI_SELECTOR) !== null;

const clipLabel = (text: string): string | undefined => {
  const normalized = normalizeLabelText(text);
  if (normalized.length < MIN_LABEL_LENGTH) {
    return;
  }
  return normalized.length <= MAX_LABEL_LENGTH ? normalized : normalized.slice(0, MAX_LABEL_LENGTH);
};

const addCandidate = (candidates: Set<string>, text: string | null | undefined): void => {
  const clipped = text ? clipLabel(text) : undefined;
  if (clipped) {
    candidates.add(clipped);
  }
};

const collectDeepTextCandidates = (element: Element, candidates: Set<string>): void => {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const texts: string[] = [];

  while (walker.nextNode()) {
    const currentText = walker.currentNode.textContent;
    const clipped = clipLabel(currentText === null ? '' : currentText);
    if (clipped) {
      texts.push(clipped);
    }
  }

  texts.sort((left, right) => left.length - right.length);
  for (const text of texts) {
    candidates.add(text);
  }
};

const collectDirectCandidates = (element: Element, candidates: Set<string>): void => {
  addCandidate(candidates, element.getAttribute('aria-label'));

  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    addCandidate(candidates, document.getElementById(labelledBy)?.textContent);
  }

  addCandidate(candidates, element.getAttribute('placeholder'));

  if (element instanceof HTMLImageElement) {
    addCandidate(candidates, element.alt);
  }

  if (HEADING_TAG_PATTERN.test(element.tagName)) {
    addCandidate(candidates, element.textContent);
  }
};

const sortCandidates = (candidates: Set<string>): string[] =>
  [...candidates].sort((left, right) => left.length - right.length);

/** Closest-first tiers: clicked subtree, then each ancestor (no distant heading leaks). */
const collectCandidatesInTiers = (element: Element): string[][] => {
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
};

/**
 * Count page elements whose normalized text exactly matches.
 *
 * @param text - Candidate label text to compare against page elements.
 * @returns Count of matching elements outside Report Mode UI chrome.
 * @example
 * const matches = countElementsWithExactLabel('Save');
 */
const countElementsWithExactLabel = (text: string): number => {
  const normalized = normalizeLabelText(text);
  if (!normalized) {
    return 0;
  }

  let count = 0;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);

  while (walker.nextNode()) {
    const element = walker.currentNode as Element;
    const rawText = element.textContent;
    const elementText = rawText === null ? '' : rawText;
    if (!isReportModeUi(element) && normalizeLabelText(elementText) === normalized) {
      count += 1;
    }
  }

  return count;
};

/**
 * Shortest readable label that uniquely identifies the clicked spot on the page.
 * Prefers labels from the clicked element's subtree before walking up the parent chain.
 *
 * @param element - DOM element selected in dev-only Report Mode.
 * @returns The shortest stable label to describe the selected element to an assistant.
 * @example
 * const label = getShortestUniqueLabel(button);
 */
const getShortestUniqueLabel = (element: Element): string => {
  const tiers = collectCandidatesInTiers(element);

  for (const candidates of tiers) {
    for (const candidate of candidates) {
      if (countElementsWithExactLabel(candidate) === 1) {
        return candidate;
      }
    }
  }

  for (const candidates of tiers) {
    const [shortest] = candidates;
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
};

export {
  countElementsWithExactLabel,
  getAccessibleName,
  getCssPath,
  getShortestUniqueLabel,
  getVisibleText,
  normalizeLabelText,
};
