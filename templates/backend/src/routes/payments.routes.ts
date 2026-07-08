import { handleWebhook, readWebhookRawBody } from '@vybekiit/payments/http';
import { createExpressPaymentsRouter } from '@vybekiit/payments/http/express';
import type { Request, Response } from 'express';
import { fulfillOrderEffect } from '@/lib/fulfillment.js';

/**
 * Normalize a Node header value into a plain string.
 *
 * @param value - Header value from Express.
 * @returns String header value, or an empty string when missing.
 * @example
 * const signature = headerText(req.headers['x-signature']);
 */
const headerText = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) {
    return value.join(',');
  }

  if (value === undefined) {
    return '';
  }

  return value;
};

/**
 * Read the request origin as a nullable string.
 *
 * @param req - Express request carrying headers.
 * @returns Origin header value, or null when absent.
 * @example
 * const origin = requestOrigin(req);
 */
const requestOrigin = (req: Request): string | null => {
  const { origin } = req.headers;
  if (origin === undefined) {
    return null;
  }

  return headerText(origin);
};

/**
 * Resolve checkout dependencies from the current Express request.
 *
 * @param req - Express request that may carry an Origin header.
 * @returns Payments checkout dependencies for this request.
 * @example
 * const deps = checkoutDeps(req);
 */
const checkoutDeps = (req: Request) => {
  const { APP_URL, FRONTEND_URL } = process.env;
  const frontendUrl = FRONTEND_URL === undefined ? APP_URL : FRONTEND_URL;

  return {
    env: process.env,
    appUrl: APP_URL,
    frontendUrl,
    requestOrigin: requestOrigin(req),
  };
};

/** Express router that exposes checkout endpoints backed by the payments package. */
export const paymentsRouter = createExpressPaymentsRouter(checkoutDeps, {
  fulfillOrder: fulfillOrderEffect,
});

/**
 * Handle a verified payment provider webhook request.
 *
 * @param req - Express request containing the raw webhook body and headers.
 * @param res - Express response used to send the normalized webhook result.
 * @returns Promise that settles after fulfillment and response writing finish.
 * @example
 * app.post('/api/webhook', rawBodyMiddleware, handlePaymentsWebhook);
 */
export const handlePaymentsWebhook = async (req: Request, res: Response): Promise<void> => {
  const rawBody = readWebhookRawBody(req.body);
  const headers = Object.fromEntries(
    Object.entries(req.headers).map(([key, value]) => [key, headerText(value)]),
  );
  const result = await handleWebhook(rawBody, headers, {
    fulfillOrder: fulfillOrderEffect,
    env: process.env,
  });
  res.status(result.status).json(result.body);
};
