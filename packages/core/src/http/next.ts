import type { HttpResponse } from './response';

/**
 * Convert a typed {@link HttpResponse} to a Web Response.
 *
 * @param result - Typed HTTP response produced by a route helper.
 * @param init - Optional Response init fields to merge into the JSON response.
 * @returns A Web Response suitable for Next.js App Router handlers.
 * @example
 * return toNextResponse(ok({ id: 'order_1' }));
 */
export const toNextResponse = (result: HttpResponse, init?: ResponseInit): Response => {
  const headers = new Headers(init?.headers);
  return Response.json(result.body, { ...init, status: result.status, headers });
};
