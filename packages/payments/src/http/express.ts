import type { Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';
import { type CheckoutHttpDeps, handleCheckout } from './handlers';

export type {
  CheckoutBody,
  CheckoutHttpDeps,
  PaymentsHttpResponse,
  WebhookHttpDeps,
} from './handlers';
export { handleCheckout, handleWebhook, readWebhookRawBody } from './handlers';

type ExpressCheckoutDeps = CheckoutHttpDeps | ((req: Request) => CheckoutHttpDeps);

function resolveCheckoutDeps(deps: ExpressCheckoutDeps, req: Request): CheckoutHttpDeps {
  return typeof deps === 'function' ? deps(req) : deps;
}

function send(res: Response, status: number, body: unknown): void {
  res.status(status).json(body);
}

/** Mount on `/api` — checkout only; register webhook separately with `express.raw()`. */
export function createExpressPaymentsRouter(checkoutDeps: ExpressCheckoutDeps): Router {
  const router = createRouter();

  router.post('/checkout', async (req, res) => {
    const result = await handleCheckout(req.body, resolveCheckoutDeps(checkoutDeps, req));
    send(res, result.status, result.body);
  });

  return router;
}
