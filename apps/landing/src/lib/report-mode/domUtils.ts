const MIN_LABEL_LENGTH = 2;
const MAX_LABEL_LENGTH = 80;
const REPORT_MODE_UI_SELECTOR = '[data-report-mode-ui]';
// collapse any whitespace run to one space: "a   b" -> "a b"
const WHITESPACE_RUN = /\s+/g;
// heading tag only: "H1" matches, "DIV" does not.
const HEADING_TAG = /^H[1-6]$/i;

/**
 * Collapse whitespace for label comparison.
 *
 * @param text - Raw label text.
 * @returns Trimmed label with whitespace collapsed.
 * @example
 * const label = normalizeLabelText('Save   now');
 */
const normalizeLabelText = (text: string): string => text.replace(WHITESPACE_RUN, ' ').trim();

/**
 * Build a stable CSS selector path for an element.
 *
 * @param element - Element to identify.
 * @returns Best-effort CSS path for dev-only Report Mode.
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
 * Read a best-effort accessible name for a DOM element.
 *
 * @param element - Element to inspect.
 * @returns Accessible name when one is present.
 * @example
 * const name = getAccessibleName(button);
 */
const getAccessibleName = (element: Element): string | undefined => {
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const label = document.getElementById(labelledBy);
    const text = label?.textContent?.trim();
    if (text !== undefined && text.length > 0) {
      return text;
    }
  }
  const ariaLabel = element.getAttribute('aria-label')?.trim();
  if (ariaLabel !== undefined && ariaLabel.length > 0) {
    return ariaLabel;
  }
  const text = element.textContent?.trim();
  return text !== undefined && text.length > 0 ? text.slice(0, 120) : undefined;
};

/**
 * Read visible text from an element.
 *
 * @param element - Element to inspect.
 * @returns Trimmed and capped visible text when present.
 * @example
 * const text = getVisibleText(button);
 */
const getVisibleText = (element: Element): string | undefined => {
  const text = element.textContent?.replace(WHITESPACE_RUN, ' ').trim();
  if (text === undefined || text.length === 0) {
    return;
  }
  return text.slice(0, 200);
};

/**
 * Check whether an element belongs to Report Mode UI.
 *
 * @param element - Element to inspect.
 * @returns True when the element is inside Report Mode UI.
 * @example
 * const isUi = isReportModeUi(element);
 */
const isReportModeUi = (element: Element): boolean =>
  element.closest(REPORT_MODE_UI_SELECTOR) !== null;

/**
 * Normalize and cap a candidate label.
 *
 * @param text - Raw label text.
 * @returns Clipped label when it is long enough.
 * @example
 * const label = clipLabel('Checkout button');
 */
const clipLabel = (text: string): string | undefined => {
  const normalized = normalizeLabelText(text);
  if (normalized.length < MIN_LABEL_LENGTH) {
    return;
  }
  return normalized.length <= MAX_LABEL_LENGTH ? normalized : normalized.slice(0, MAX_LABEL_LENGTH);
};

/**
 * Add a normalized label candidate to the set.
 *
 * @param candidates - Candidate set to mutate.
 * @param text - Optional raw label text.
 * @returns Nothing.
 * @example
 * addCandidate(candidates, element.textContent);
 */
const addCandidate = (candidates: Set<string>, text: string | null | undefined): void => {
  const clipped = text === null || text === undefined ? undefined : clipLabel(text);
  if (clipped !== undefined) {
    candidates.add(clipped);
  }
};

/**
 * Collect text-node candidates from an element subtree.
 *
 * @param element - Element whose subtree should be scanned.
 * @param candidates - Candidate set to mutate.
 * @returns Nothing.
 * @example
 * collectDeepTextCandidates(button, candidates);
 */
const collectDeepTextCandidates = (element: Element, candidates: Set<string>): void => {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const texts: string[] = [];

  while (walker.nextNode()) {
    const textContent = walker.currentNode.textContent;
    const clipped = textContent === null ? undefined : clipLabel(textContent);
    if (clipped !== undefined) {
      texts.push(clipped);
    }
  }

  texts.sort((left, right) => left.length - right.length);
  for (const text of texts) {
    candidates.add(text);
  }
};

/**
 * Collect direct label candidates from one element.
 *
 * @param element - Element to inspect.
 * @param candidates - Candidate set to mutate.
 * @returns Nothing.
 * @example
 * collectDirectCandidates(button, candidates);
 */
const collectDirectCandidates = (element: Element, candidates: Set<string>): void => {
  addCandidate(candidates, element.getAttribute('aria-label'));

  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy !== null) {
    addCandidate(candidates, document.getElementById(labelledBy)?.textContent);
  }

  addCandidate(candidates, element.getAttribute('placeholder'));

  if (element instanceof HTMLImageElement) {
    addCandidate(candidates, element.alt);
  }

  if (HEADING_TAG.test(element.tagName)) {
    addCandidate(candidates, element.textContent);
  }
};

/**
 * Sort candidates shortest first.
 *
 * @param candidates - Candidate set to sort.
 * @returns Sorted candidate labels.
 * @example
 * const labels = sortCandidates(candidates);
 */
const sortCandidates = (candidates: Set<string>): string[] =>
  [...candidates].sort((left, right) => left.length - right.length);

/**
 * Collect closest-first label candidate tiers.
 *
 * @param element - Clicked element.
 * @returns Candidate tiers from subtree to ancestors.
 * @example
 * const tiers = collectCandidatesInTiers(button);
 */
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
 * @param text - Label text to match.
 * @returns Count of matching non-Report-Mode elements.
 * @example
 * const count = countElementsWithExactLabel('Buy now');
 */
const countElementsWithExactLabel = (text: string): number => {
  const normalized = normalizeLabelText(text);
  if (normalized.length === 0) {
    return 0;
  }

  let count = 0;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);

  while (walker.nextNode()) {
    const element = walker.currentNode as Element;
    const elementText = element.textContent;
    if (
      !isReportModeUi(element) &&
      elementText !== null &&
      normalizeLabelText(elementText) === normalized
    ) {
      count += 1;
    }
  }

  return count;
};

/**
 * Find the shortest readable label that uniquely identifies a clicked spot.
 *
 * @param element - Clicked element.
 * @returns Short unique label, accessible fallback, visible text fallback, or tag name.
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
    const shortest = candidates[0];
    if (shortest !== undefined) {
      return shortest;
    }
  }

  const accessible = getAccessibleName(element);
  if (accessible !== undefined) {
    const clipped = clipLabel(accessible);
    if (clipped !== undefined) {
      return clipped;
    }
  }

  const visible = getVisibleText(element);
  if (visible !== undefined) {
    const clipped = clipLabel(visible);
    if (clipped !== undefined) {
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
