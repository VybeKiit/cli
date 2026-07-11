/** Default page size for agent-facing list/search tools. */
export const DEFAULT_PAGE_LIMIT = 20;

/** Hard cap so a single tool call cannot dump an entire catalog into context. */
export const MAX_PAGE_LIMIT = 50;

/** Cursor-paginated result envelope returned by list/search tools. */
export type PageResult<T> = {
  readonly items: readonly T[];
  readonly total: number;
  readonly limit: number;
  readonly offset: number;
  readonly hasMore: boolean;
  readonly nextCursor: string | null;
};

/**
 * Decode a pagination cursor into a non-negative offset.
 *
 * @param cursor - Opaque cursor from a previous page, or undefined for page 0.
 * @returns Offset into the ranked result list.
 * @example
 * decodeCursor(encodeCursor(20)) === 20;
 */
export const decodeCursor = (cursor: string | undefined): number => {
  if (cursor === undefined || cursor.length === 0) {
    return 0;
  }
  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf8');
    const offset = Number.parseInt(raw, 10);
    if (!Number.isFinite(offset) || offset < 0) {
      return 0;
    }
    return offset;
  } catch {
    return 0;
  }
};

/**
 * Encode a list offset as an opaque pagination cursor.
 *
 * @param offset - Absolute offset into the ranked result list.
 * @returns Base64url cursor string.
 * @example
 * decodeCursor(encodeCursor(0)) === 0;
 */
export const encodeCursor = (offset: number): string =>
  Buffer.from(String(Math.max(0, Math.floor(offset))), 'utf8').toString('base64url');

/**
 * Clamp a requested page limit into the allowed range.
 *
 * @param limit - Caller-requested limit, or undefined for the default.
 * @returns Limit between 1 and {@link MAX_PAGE_LIMIT}.
 * @example
 * resolvePageLimit(100) === MAX_PAGE_LIMIT;
 */
export const resolvePageLimit = (limit: number | undefined): number => {
  if (limit === undefined || !Number.isFinite(limit)) {
    return DEFAULT_PAGE_LIMIT;
  }
  const floored = Math.floor(limit);
  if (floored < 1) {
    return 1;
  }
  if (floored > MAX_PAGE_LIMIT) {
    return MAX_PAGE_LIMIT;
  }
  return floored;
};

/**
 * Slice a ranked list into a cursor page envelope.
 *
 * @param items - Full ranked list (already filtered/sorted).
 * @param options - Optional limit and cursor.
 * @returns Page envelope with `nextCursor` when more items remain.
 * @example
 * const page = paginate(['a', 'b', 'c'], { limit: 2 });
 * page.items // ['a', 'b']
 * page.hasMore // true
 */
export const paginate = <T>(
  items: readonly T[],
  options?: { readonly limit?: number; readonly cursor?: string },
): PageResult<T> => {
  const limit = resolvePageLimit(options?.limit);
  const offset = decodeCursor(options?.cursor);
  const slice = items.slice(offset, offset + limit);
  const nextOffset = offset + slice.length;
  const hasMore = nextOffset < items.length;

  return {
    items: slice,
    total: items.length,
    limit,
    offset,
    hasMore,
    nextCursor: hasMore ? encodeCursor(nextOffset) : null,
  };
};
