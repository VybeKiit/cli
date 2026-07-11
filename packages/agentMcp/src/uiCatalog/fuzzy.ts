/** Split query / haystack text on whitespace. "hero   bento" → ["hero", "bento"] */
const whitespacePattern = /\s+/;

/**
 * Normalize free text for fuzzy matching.
 *
 * @param value - Raw string from a query or catalog field.
 * @returns Lowercased trimmed text.
 * @example
 * normalizeText('  Hero ') === 'hero';
 */
export const normalizeText = (value: string): string => value.trim().toLowerCase();

/**
 * Tokenize free text into lowercase terms.
 *
 * @param value - Raw query or field text.
 * @returns Non-empty lowercase tokens.
 * @example
 * tokenize('animated hero') // ['animated', 'hero']
 */
export const tokenize = (value: string): readonly string[] =>
  normalizeText(value).split(whitespacePattern).filter(Boolean);

/**
 * Cheap Levenshtein distance capped early when the bound is exceeded.
 *
 * @param a - First string.
 * @param b - Second string.
 * @param maxDistance - Stop computing once distance exceeds this bound.
 * @returns Edit distance, or `maxDistance + 1` when over the bound.
 * @example
 * levenshtein('hero', 'herro', 2) === 1;
 */
export const levenshtein = (a: string, b: string, maxDistance = 2): number => {
  if (a === b) {
    return 0;
  }
  if (a.length === 0) {
    return b.length;
  }
  if (b.length === 0) {
    return a.length;
  }
  if (Math.abs(a.length - b.length) > maxDistance) {
    return maxDistance + 1;
  }

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  const current = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    let rowMin = current[0] ?? 0;
    const aChar = a.charAt(i - 1);
    for (let j = 1; j <= b.length; j += 1) {
      const cost = aChar === b.charAt(j - 1) ? 0 : 1;
      const deletion = (previous[j] ?? 0) + 1;
      const insertion = (current[j - 1] ?? 0) + 1;
      const substitution = (previous[j - 1] ?? 0) + cost;
      const value = Math.min(deletion, insertion, substitution);
      current[j] = value;
      if (value < rowMin) {
        rowMin = value;
      }
    }
    if (rowMin > maxDistance) {
      return maxDistance + 1;
    }
    for (let j = 0; j <= b.length; j += 1) {
      previous[j] = current[j] ?? 0;
    }
  }

  return previous[b.length] ?? maxDistance + 1;
};

/**
 * Score one query term against one haystack string (fzf-style + typo tolerance).
 *
 * @param term - Single lowercase query token.
 * @param haystack - Lowercase field or joined field text.
 * @returns Non-negative score (0 = no match).
 * @example
 * scoreTerm('hero', 'hero-parallax') > scoreTerm('hero', 'pricing-card');
 */
export const scoreTerm = (term: string, haystack: string): number => {
  if (term.length === 0 || haystack.length === 0) {
    return 0;
  }
  if (haystack === term) {
    return 100;
  }
  if (haystack.startsWith(term)) {
    return 80;
  }
  if (haystack.includes(term)) {
    return 60;
  }

  // Ordered subsequence: "hrp" matches "hero-parallax"
  let termIndex = 0;
  for (let i = 0; i < haystack.length && termIndex < term.length; i += 1) {
    if (haystack.charAt(i) === term.charAt(termIndex)) {
      termIndex += 1;
    }
  }
  if (termIndex === term.length) {
    return 35;
  }

  // Typo tolerance against individual whitespace tokens in the haystack.
  const maxDistance = term.length <= 4 ? 1 : 2;
  const tokens = haystack.split(whitespacePattern).filter(Boolean);
  for (const token of tokens) {
    const distance = levenshtein(term, token, maxDistance);
    if (distance <= maxDistance) {
      return distance === 1 ? 45 : 30;
    }
    // Also score hyphenated segments: hero-parallax → hero, parallax
    for (const segment of token.split('-')) {
      if (segment.length === 0) {
        continue;
      }
      const segmentDistance = levenshtein(term, segment, maxDistance);
      if (segmentDistance <= maxDistance) {
        return segmentDistance === 1 ? 45 : 30;
      }
    }
  }

  return 0;
};

/** Multi-term match mode: `all` requires every term; `any` sums matches. */
export type ScoreQueryMode = 'all' | 'any';

/**
 * Score a multi-term query against one or more field strings.
 *
 * @param query - Free-text query (may contain spaces).
 * @param fields - Field values to match against (name, tags, paths, …).
 * @param mode - `all` (default) requires every term; `any` keeps partial phrase matches.
 * @returns Combined score; 0 when nothing matches (or a required term misses in `all` mode).
 * @example
 * scoreQuery('animated hero', ['hero-parallax', 'animated marketing']) > 0;
 * scoreQuery('animated hero landing', ['hero-parallax'], 'any') > 0;
 */
export const scoreQuery = (
  query: string,
  fields: readonly string[],
  mode: ScoreQueryMode = 'all',
): number => {
  const terms = tokenize(query);
  if (terms.length === 0) {
    return 1;
  }

  const haystack = fields.map(normalizeText).filter(Boolean).join(' ');
  if (haystack.length === 0) {
    return 0;
  }

  let total = 0;
  for (const term of terms) {
    const termScore = scoreTerm(term, haystack);
    if (termScore === 0) {
      if (mode === 'all') {
        return 0;
      }
      continue;
    }
    total += termScore;
  }
  return total;
};
