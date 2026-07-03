import { Either, Schema } from 'effect';

import { badInput } from './builders';
import type { HttpErrorBody, HttpResponse } from './response';

export type JsonBodyResult<A> =
  | { readonly ok: true; readonly body: A }
  | { readonly ok: false; readonly response: HttpResponse<HttpErrorBody> };

/** Decode an already-parsed JSON value; map schema failure to {@link badInput}. */
export function decodeJsonBody<A, I>(
  raw: unknown,
  schema: Schema.Schema<A, I, never>,
  invalidMessage: string,
): JsonBodyResult<A> {
  const parsed = Schema.decodeUnknownEither(schema)(raw);
  if (Either.isLeft(parsed)) {
    return { ok: false, response: badInput(invalidMessage) };
  }
  return { ok: true, body: parsed.right };
}

/** Read JSON from a Web `Request`; returns `badInput` when the body is not JSON. */
export async function readRequestJson(
  request: Request,
): Promise<JsonBodyResult<unknown> | { readonly ok: true; readonly body: unknown }> {
  try {
    return { ok: true, body: await request.json() };
  } catch {
    return { ok: false, response: badInput('Invalid request body.') };
  }
}
