import { Either, Schema } from 'effect';

import { badInput } from './builders';
import type { HttpErrorBody, HttpResponse } from './response';

export type JsonBodyResult<A> =
  | { readonly ok: true; readonly body: A }
  | { readonly ok: false; readonly response: HttpResponse<HttpErrorBody> };

/**
 * Decode an already-parsed JSON value and map Schema failure to {@link badInput}.
 *
 * @param raw - Unknown JSON value to validate.
 * @param schema - Effect Schema expected by the route.
 * @param invalidMessage - Plain message returned when decoding fails.
 * @returns A body result with either decoded data or a typed bad-input response.
 * @example
 * const decoded = decodeJsonBody(await request.json(), CheckoutBody, 'Invalid checkout body.');
 */
export const decodeJsonBody = <A, I>(
  raw: unknown,
  schema: Schema.Schema<A, I, never>,
  invalidMessage: string,
): JsonBodyResult<A> => {
  const parsed = Schema.decodeUnknownEither(schema)(raw);
  if (Either.isLeft(parsed)) {
    return { ok: false, response: badInput(invalidMessage) };
  }
  return { ok: true, body: parsed.right };
};

/**
 * Read JSON from a Web Request and normalize invalid JSON.
 *
 * @param request - Web Request to read.
 * @returns A JSON body result or a typed bad-input response.
 * @example
 * const body = await readRequestJson(request);
 */
export const readRequestJson = async (
  request: Request,
): Promise<JsonBodyResult<unknown> | { readonly ok: true; readonly body: unknown }> => {
  try {
    return { ok: true, body: await request.json() };
  } catch {
    return { ok: false, response: badInput('Invalid request body.') };
  }
};
