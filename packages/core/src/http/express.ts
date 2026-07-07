import type { Response } from 'express';
import type { HttpResponse } from './response';

/**
 * Send a typed {@link HttpResponse} as JSON on an Express response.
 *
 * @param res - Express response object to write to.
 * @param result - Typed HTTP response produced by a route helper.
 * @returns Nothing; the Express response is written in place.
 * @example
 * sendHttpResponse(res, ok({ id: 'order_1' }));
 */
export const sendHttpResponse = (res: Response, result: HttpResponse): void => {
  res.status(result.status).json(result.body);
};
