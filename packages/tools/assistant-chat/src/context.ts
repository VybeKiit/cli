import { Schema } from 'effect';

/**
 * Live page snapshot the assistant is told about on every turn. Mirrors the fields
 * ReportPayload already captures (route + viewport) so the two dev tools speak the
 * same language about "where the user is right now".
 */
export const PageContext = Schema.Struct({
  route: Schema.String,
  viewportWidth: Schema.Number,
  viewportHeight: Schema.Number,
  scrollY: Schema.Number,
});

/** Static type inferred from {@link PageContext}. */
export type PageContext = Schema.Schema.Type<typeof PageContext>;

/**
 * Format page context as one prompt line for the assistant bridge.
 *
 * @param context - Validated page context from the browser.
 * @returns A compact line describing the current route, viewport, and scroll position.
 * @example
 * const line = describePageContext({ route: '/', viewportWidth: 1200, viewportHeight: 800, scrollY: 0 });
 */
export const describePageContext = (context: PageContext): string =>
  `[page] route=${context.route} viewport=${context.viewportWidth}x${context.viewportHeight} scrollY=${Math.round(context.scrollY)}`;
