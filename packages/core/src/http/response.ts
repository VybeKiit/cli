import { Schema } from 'effect';
import { HTTP_OUTCOMES, type HttpOutcomeCode } from './outcomes';

/** The semantic outcome codes as Schema literals, derived from {@link HTTP_OUTCOMES}. */
const OutcomeCodeSchema = Schema.Literal(
  ...(Object.keys(HTTP_OUTCOMES) as [HttpOutcomeCode, ...HttpOutcomeCode[]]),
);

/**
 * Schema SSOT for the JSON error envelope (ADR-0043). The OpenAPI document and
 * typed client derive from this, so every failure carries the same
 * `{ code, error }` shape wherever a route is served.
 */
export const HttpErrorBodySchema = Schema.Struct({
  code: OutcomeCodeSchema,
  error: Schema.String,
});

/** Standard JSON error body returned by HTTP helpers. */
export type HttpErrorBody = typeof HttpErrorBodySchema.Type;

/** Typed HTTP response union shared by route adapters. */
export type HttpResponse<TSuccess = unknown> =
  | { readonly status: 200; readonly body: TSuccess }
  | { readonly status: 201; readonly body: TSuccess }
  | { readonly status: 400; readonly body: HttpErrorBody }
  | { readonly status: 401; readonly body: HttpErrorBody }
  | { readonly status: 403; readonly body: HttpErrorBody }
  | { readonly status: 404; readonly body: HttpErrorBody }
  | { readonly status: 409; readonly body: HttpErrorBody }
  | { readonly status: 422; readonly body: HttpErrorBody }
  | { readonly status: 429; readonly body: HttpErrorBody }
  | { readonly status: 500; readonly body: HttpErrorBody }
  | { readonly status: 502; readonly body: HttpErrorBody }
  | { readonly status: 503; readonly body: HttpErrorBody };
