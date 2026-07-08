import type { NextFunction, Request, Response } from 'express';

/**
 * Convert unexpected Express errors into a JSON 500 response.
 *
 * @param err - Unknown error value passed through Express.
 * @param _req - Express request, unused by this terminal handler.
 * @param res - Express response used to send the error body.
 * @param _next - Express next callback, unused because this handler terminates.
 * @returns Void after writing the error response.
 * @example
 * app.use(errorHandler);
 */
export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const message = err instanceof Error ? err.message : 'Something went wrong.';
  res.status(500).json({ error: message });
};
