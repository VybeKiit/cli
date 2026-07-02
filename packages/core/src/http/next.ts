import type { HttpResponse } from './response';

/** Convert a typed {@link HttpResponse} to a Web `Response` (Next.js App Router). */
export function toNextResponse(result: HttpResponse, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  return Response.json(result.body, { ...init, status: result.status, headers });
}
