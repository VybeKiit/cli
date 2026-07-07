import type { Request, Response } from 'express';

/**
 * Return the backend health response.
 *
 * @param _req - Express request, unused for this static health route.
 * @param res - Express response used to send the health payload.
 * @returns Void after writing the JSON response.
 * @example
 * healthRouter.get('/', getHealth);
 */
export const getHealth = (_req: Request, res: Response): void => {
  res.json({ ok: true, status: 'healthy' });
};
