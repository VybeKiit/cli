import { createExpressPaymentsRouter } from '@vybekiit/payments/http/express';
import { handleWebhook, readWebhookRawBody } from '@vybekiit/payments/http';
import type { Request, Response } from 'express';
import { fulfillOrder } from '../lib/fulfillment.js';

function checkoutDeps(req: Request) {
  return {
    env: process.env,
    appUrl: process.env.APP_URL,
    frontendUrl: process.env.FRONTEND_URL ?? process.env.APP_URL,
    requestOrigin: req.headers.origin ?? null,
  };
}

export const paymentsRouter = createExpressPaymentsRouter(checkoutDeps, { fulfillOrder });

export async function handlePaymentsWebhook(req: Request, res: Response): Promise<void> {
  const rawBody = readWebhookRawBody(req.body);
  const headers = Object.fromEntries(
    Object.entries(req.headers).map(([key, value]) => [
      key,
      Array.isArray(value) ? value.join(',') : (value ?? ''),
    ]),
  );
  const result = await handleWebhook(rawBody, headers, { fulfillOrder, env: process.env });
  res.status(result.status).json(result.body);
}
