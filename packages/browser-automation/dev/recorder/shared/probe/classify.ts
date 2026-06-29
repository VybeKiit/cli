import type { ParsedEntry } from '../draft';
import { LS_DRAFT_FIELDS } from '../../../../src/domains/payments/ls/selectors/fields';
import {
  LS_FIELD_HINTS,
  type LsFieldHint,
} from '../../../../src/domains/payments/ls/selectors/hints';
import type { ClassifiedMatch, DomCandidate, PageSnapshot } from './types';

function matchesPattern(value: string | null | undefined, pattern: RegExp | undefined): boolean {
  if (!pattern || !value) return false;
  return pattern.test(value);
}

function hintMatchesCandidate(
  hint: LsFieldHint,
  pathname: string,
  candidate: DomCandidate,
  fileInputIndex?: number,
): boolean {
  if (hint.pathPattern && !hint.pathPattern.test(pathname)) return false;
  if (hint.tags && !hint.tags.includes(candidate.tag)) return false;
  if (hint.inputType && candidate.type !== hint.inputType) return false;
  if (hint.fileInputIndex !== undefined) {
    if (candidate.type !== 'file' || fileInputIndex !== hint.fileInputIndex) return false;
  }

  if (
    hint.nearestHeadingPattern &&
    !matchesPattern(candidate.nearestHeading, hint.nearestHeadingPattern)
  ) {
    return false;
  }

  if (hint.roles) {
    const inferred = inferRole(candidate);
    const textboxOk =
      (candidate.tag === 'input' || candidate.tag === 'textarea') && hint.roles.includes('textbox');
    if (!hint.roles.includes(inferred) && !textboxOk) return false;
  }

  const labelText = candidate.associatedLabel ?? candidate.ariaLabel;
  const hasTextMatchers = !!(hint.labelPattern || hint.placeholderPattern || hint.textPattern);
  if (hasTextMatchers) {
    const textOk =
      matchesPattern(labelText, hint.labelPattern) ||
      matchesPattern(candidate.placeholder, hint.placeholderPattern) ||
      matchesPattern(candidate.textContent, hint.textPattern);
    if (!textOk && !(hint.allowEmptyText && !candidate.textContent?.trim())) return false;
    if (!textOk && hint.allowEmptyText) return true;
    return textOk;
  }

  if (hint.allowEmptyText && candidate.tag === 'button' && !candidate.textContent?.trim()) {
    return true;
  }

  return true;
}

function inferRole(candidate: DomCandidate): string {
  if (candidate.role) return candidate.role;
  if (candidate.tag === 'button') return 'button';
  if (candidate.tag === 'a') return 'link';
  if (candidate.tag === 'input' && candidate.type === 'checkbox') return 'checkbox';
  if (candidate.role === 'switch') return 'switch';
  if (candidate.tag === 'input' || candidate.tag === 'textarea') return 'textbox';
  if (candidate.tag === 'select') return 'combobox';
  return candidate.tag;
}

/** Build a Playwright-friendly ParsedEntry from a DOM candidate. */
export function candidateToEntry(candidate: DomCandidate): ParsedEntry | null {
  const role = inferRole(candidate);
  const label = candidate.associatedLabel ?? candidate.ariaLabel;
  const buttonText = candidate.textContent?.trim();

  if ((role === 'button' || role === 'link') && buttonText) {
    return { kind: 'role', role, name: buttonText };
  }

  if (role === 'checkbox' && label) {
    return { kind: 'role', role: 'checkbox', name: label };
  }

  if (role === 'switch') {
    const switchName = label ?? candidate.ariaLabel ?? buttonText;
    if (switchName) return { kind: 'role', role: 'switch', name: switchName };
  }

  if (role === 'button' && candidate.ariaLabel) {
    return { kind: 'role', role: 'button', name: candidate.ariaLabel };
  }

  if (role === 'button' && candidate.id) {
    return { kind: 'css', selector: `#${candidate.id}` };
  }

  if (candidate.id && (candidate.tag === 'input' || candidate.tag === 'textarea')) {
    return { kind: 'css', selector: `${candidate.tag}#${candidate.id}` };
  }

  if (label && (role === 'textbox' || candidate.tag === 'input' || candidate.tag === 'textarea')) {
    return { kind: 'role', role: 'textbox', name: label };
  }

  if (candidate.placeholder && (candidate.tag === 'input' || candidate.tag === 'textarea')) {
    return { kind: 'placeholder', text: candidate.placeholder };
  }

  if (label) return { kind: 'label', text: label };

  if (candidate.id) return { kind: 'css', selector: `#${candidate.id}` };

  if (candidate.type === 'file') {
    return { kind: 'css', selector: 'input[type="file"]' };
  }

  const plainText = candidate.textContent?.trim();
  if (plainText && ['span', 'label', 'div', 'p'].includes(candidate.tag)) {
    return { kind: 'css', selector: `text=${plainText}` };
  }

  return null;
}

function classifyPage(page: PageSnapshot, hints: readonly LsFieldHint[]): ClassifiedMatch[] {
  const matches: ClassifiedMatch[] = [];
  const fileIndexByCandidate = new Map<DomCandidate, number>();
  let fileInputSeen = 0;
  for (const candidate of page.candidates) {
    if (candidate.type === 'file') fileIndexByCandidate.set(candidate, fileInputSeen++);
  }

  for (const hint of [...hints].sort((a, b) => a.priority - b.priority)) {
    for (const candidate of page.candidates) {
      if (candidate.id?.startsWith('headlessui-menu-button')) continue;
      const fileIdx = fileIndexByCandidate.get(candidate);
      if (!hintMatchesCandidate(hint, page.pathname, candidate, fileIdx)) continue;
      const entry = candidateToEntry(candidate);
      if (!entry) continue;
      matches.push({
        fieldKey: hint.fieldKey,
        entry,
        pageUrl: page.url,
        candidate,
      });
      break;
    }
  }

  return matches;
}

/** Scrape store/variant IDs from crawled URLs, hrefs, and embedded page JSON. */
export function scrapeIdMatches(pages: PageSnapshot[]): ClassifiedMatch[] {
  const out: ClassifiedMatch[] = [];
  const urls = pages.flatMap((p) => [p.url, ...p.hrefs]);

  for (const raw of urls) {
    let parsed: URL;
    try {
      parsed = new URL(raw);
    } catch {
      continue;
    }

    const storeMatch =
      parsed.pathname.match(/\/stores\/(\d+)/) ?? parsed.pathname.match(/\/store\/(\d+)/);
    if (storeMatch && !out.some((m) => m.fieldKey === 'dashboard.storeId')) {
      const storeId = storeMatch[1]!;
      out.push({
        fieldKey: 'dashboard.storeId',
        entry: { kind: 'css', selector: `a[href*="/stores/${storeId}"]` },
        pageUrl: raw,
        candidate: emptyLinkCandidate(raw),
      });
    }

    const variantMatch = parsed.pathname.match(/\/variants\/(\d+)/);
    if (variantMatch && !out.some((m) => m.fieldKey === 'dashboard.variantId')) {
      const variantId = variantMatch[1]!;
      out.push({
        fieldKey: 'dashboard.variantId',
        entry: { kind: 'css', selector: `a[href*="/variants/${variantId}"]` },
        pageUrl: raw,
        candidate: emptyLinkCandidate(raw),
      });
    }

    const productMatch = parsed.pathname.match(/\/products\/(\d+)/);
    if (productMatch && !out.some((m) => m.fieldKey === 'dashboard.variantId')) {
      out.push({
        fieldKey: 'dashboard.variantId',
        entry: { kind: 'css', selector: '#input_name' },
        pageUrl: raw,
        candidate: emptyLinkCandidate(raw),
      });
    }
  }

  for (const page of pages) {
    for (const c of page.candidates) {
      if (
        c.href?.includes('/variants/') &&
        !out.some((m) => m.fieldKey === 'dashboard.variantId')
      ) {
        const m = c.href.match(/\/variants\/(\d+)/);
        if (m) {
          out.push({
            fieldKey: 'dashboard.variantId',
            entry: { kind: 'role', role: 'link', name: c.textContent ?? `variant ${m[1]}` },
            pageUrl: page.url,
            candidate: c,
          });
        }
      }
    }
  }

  return out;
}

function emptyLinkCandidate(href: string): DomCandidate {
  return {
    tag: 'a',
    role: 'link',
    ariaLabel: null,
    associatedLabel: null,
    placeholder: null,
    textContent: null,
    href,
    type: null,
    nearestHeading: null,
    id: null,
  };
}

/** Parse embedded JSON ids from HTML (passive — no clicks). */
export function scrapeIdsFromHtml(html: string, pageUrl: string): ClassifiedMatch[] {
  const out: ClassifiedMatch[] = [];
  const store =
    html.match(/"store_id"\s*:\s*"?(\d+)"?/) ??
    html.match(/store_id(?:&quot;|")\s*:\s*(\d+)/) ??
    html.match(/"storeId"\s*:\s*"?(\d+)"?/) ??
    html.match(/store_id[=:](\d+)/);
  const variant =
    html.match(/"variant_id"\s*:\s*"?(\d+)"?/) ??
    html.match(/variant_id(?:&quot;|")\s*:\s*(\d+)/) ??
    html.match(/"variantId"\s*:\s*"?(\d+)"?/) ??
    html.match(/variant_id[=:](\d+)/);

  if (store) {
    const storeId = store[1]!;
    out.push({
      fieldKey: 'dashboard.storeId',
      entry: { kind: 'css', selector: `[src*="/stores/${storeId}/"]` },
      pageUrl,
      candidate: emptyLinkCandidate(pageUrl),
    });
  }

  if (variant) {
    const variantId = variant[1]!;
    out.push({
      fieldKey: 'dashboard.variantId',
      entry: { kind: 'css', selector: `[href*="/variants/${variantId}"]` },
      pageUrl,
      candidate: emptyLinkCandidate(pageUrl),
    });
  }

  return out;
}

/** Merge matches across pages — first win per field key. */
export function mergeClassifiedMatches(
  matches: ClassifiedMatch[],
): Record<string, ClassifiedMatch> {
  const out: Record<string, ClassifiedMatch> = {};
  for (const match of matches) {
    if (!out[match.fieldKey]) out[match.fieldKey] = match;
  }
  return out;
}

/** Classify all crawled pages into LS field keys. */
export function classifyCrawlPages(
  pages: PageSnapshot[],
  hints: readonly LsFieldHint[] = LS_FIELD_HINTS,
  htmlByUrl: Record<string, string> = {},
): Record<string, ClassifiedMatch> {
  const all: ClassifiedMatch[] = [];
  for (const page of pages) {
    all.push(...classifyPage(page, hints));
    const html = htmlByUrl[page.url];
    if (html) all.push(...scrapeIdsFromHtml(html, page.url));
  }
  all.push(...scrapeIdMatches(pages));
  return mergeClassifiedMatches(all);
}

export function missingFieldKeys(matched: Record<string, ClassifiedMatch>): string[] {
  return LS_DRAFT_FIELDS.filter((key) => !matched[key]);
}
