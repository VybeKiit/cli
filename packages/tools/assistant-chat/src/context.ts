import { Schema } from 'effect';

/**
 * Live page snapshot the assistant is told about on every turn — mirrors the fields
 * ReportPayload already captures (route + viewport) so the two dev tools speak the
 * same language about "where the user is right now".
 */
export const PageContext = Schema.Struct({
  route: Schema.String,
  viewportWidth: Schema.Number,
  viewportHeight: Schema.Number,
  scrollY: Schema.Number,
});
export type PageContext = Schema.Schema.Type<typeof PageContext>;

/** One human-readable line the bridge prepends to the prompt so the agent sees context. */
export function describePageContext(context: PageContext): string {
  return `[page] route=${context.route} viewport=${context.viewportWidth}x${context.viewportHeight} scrollY=${Math.round(context.scrollY)}`;
}
