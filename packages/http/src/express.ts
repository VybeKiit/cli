import type { Response } from 'express';
import type { HttpResponse } from './response';

/** Send a typed {@link HttpResponse} as JSON on an Express response. */
export function sendHttpResponse(res: Response, result: HttpResponse): void {
  res.status(result.status).json(result.body);
}
