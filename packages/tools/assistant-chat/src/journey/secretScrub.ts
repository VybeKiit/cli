/**
 * Strip secrets from strings before they hit the DOM, logs, or test output.
 * Vibe-coder safety: never echo API keys / tokens from tool payloads.
 */

const SECRET_PATTERNS: readonly RegExp[] = [
  // sk_live_… / sk_test_… / pk_live_…
  /\b(?:sk|pk)_(?:live|test)_[A-Za-z0-9]{10,}\b/g,
  // Bearer tokens
  /\bBearer\s+[A-Za-z0-9\-._~+/]+=*\b/gi,
  // Generic API key assignments in copy
  /\b(?:api[_-]?key|access[_-]?token|secret[_-]?key|auth[_-]?token)\s*[:=]\s*['"]?[^\s'"]{8,}['"]?/gi,
  // AWS-ish keys
  /\bAKIA[0-9A-Z]{16}\b/g,
  // Long base64-ish secrets (32+)
  /\b(?:password|passwd|secret|token)\s*[:=]\s*['"]?[^\s'"]{16,}['"]?/gi,
  // DATABASE_URL with credentials
  /\b(?:postgres|postgresql|mysql|mongodb(?:\+srv)?):\/\/[^\s'"]+/gi,
];

const REDACTED = '[redacted]';

/**
 * Replace known secret shapes with a safe placeholder.
 *
 * @param input - Raw text that may contain credentials.
 * @returns Scrubbed text safe for UI / logs.
 * @example
 * scrubSecrets('key=sk_live_abc1234567890') // 'key=[redacted]'
 */
export const scrubSecrets = (input: string): string => {
  let out = input;
  for (const pattern of SECRET_PATTERNS) {
    out = out.replace(pattern, REDACTED);
  }
  return out;
};

/**
 * True when the string looks like it still contains a secret-shaped value.
 * Used in tests and defensive UI guards.
 *
 * @param input - Text to inspect.
 * @returns Whether a secret pattern still matches.
 * @example
 * looksLikeSecret('sk_live_abcdefghij') // true
 */
export const looksLikeSecret = (input: string): boolean => {
  for (const pattern of SECRET_PATTERNS) {
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0;
    if (pattern.test(input)) {
      return true;
    }
  }
  return false;
};
