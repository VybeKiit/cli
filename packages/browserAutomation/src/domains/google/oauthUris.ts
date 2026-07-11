/**
 * Strip trailing slashes from an OAuth URI or origin for exact Console matching.
 *
 * Google rejects trailing-slash mismatches on redirect URIs. Origins never include a path.
 *
 * @param uri - Raw redirect URI or JavaScript origin.
 * @returns Normalized URI without trailing slashes (empty input stays empty).
 * @example
 * normalizeOAuthUri('http://localhost:3000/'); // 'http://localhost:3000'
 */
export const normalizeOAuthUri = (uri: string): string => {
  const trimmed = uri.trim();
  if (trimmed.length === 0) return '';
  return trimmed.replace(/\/+$/, '');
};

/**
 * Derive the scheme+host(+port) origin from a redirect URI.
 *
 * @param redirect - Full authorized redirect URI.
 * @returns Origin string, or null when the URI is not parseable.
 * @example
 * originFromRedirect('http://localhost:3000/api/auth/callback/google');
 * // 'http://localhost:3000'
 */
export const originFromRedirect = (redirect: string): string | null => {
  try {
    return new URL(normalizeOAuthUri(redirect)).origin;
  } catch {
    return null;
  }
};

/**
 * Unique JavaScript origins derived from redirect URIs (order preserved).
 *
 * @param redirects - Authorized redirect URIs.
 * @returns Deduplicated origins suitable for the Auth Platform origins section.
 * @example
 * originsFromRedirects([
 *   'https://app.example/api/auth/callback/google',
 *   'http://localhost:3000/api/auth/callback/google',
 * ]);
 */
export const originsFromRedirects = (redirects: readonly string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const redirect of redirects) {
    const origin = originFromRedirect(redirect);
    if (origin !== null && !seen.has(origin)) {
      seen.add(origin);
      out.push(origin);
    }
  }
  return out;
};

/**
 * Merge existing Console values with desired URIs (exact match after normalize, no dupes).
 *
 * @param existing - Values already present on the form.
 * @param desired - Values the agent wants registered.
 * @returns Union list preserving existing order then new desired entries.
 * @example
 * mergeOAuthUris(
 *   ['https://app.example/api/auth/callback/google'],
 *   ['http://localhost:3000/api/auth/callback/google'],
 * );
 */
export const mergeOAuthUris = (
  existing: readonly string[],
  desired: readonly string[],
): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of [...existing, ...desired]) {
    const normalized = normalizeOAuthUri(raw);
    if (normalized.length > 0 && !seen.has(normalized)) {
      seen.add(normalized);
      out.push(normalized);
    }
  }
  return out;
};

/**
 * Resolve JS origins: explicit list when provided, otherwise derived from redirects.
 *
 * @param redirects - Authorized redirect URIs.
 * @param explicitOrigins - Optional `--js-origin` values from the CLI.
 * @returns Final origins list to apply on the client form.
 * @example
 * resolveJsOrigins(redirects, ['http://localhost:3000']);
 */
export const resolveJsOrigins = (
  redirects: readonly string[],
  explicitOrigins?: readonly string[],
): string[] => {
  if (explicitOrigins !== undefined && explicitOrigins.length > 0) {
    return mergeOAuthUris([], explicitOrigins);
  }
  return originsFromRedirects(redirects);
};
