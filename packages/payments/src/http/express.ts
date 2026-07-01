import type { Request, Response, Router } from 'express';
import { sendHttpResponse } from '@vybekiit/http/express';
import { Router as createRouter } from 'express';
import {
  type CheckoutHttpDeps,
  type PracticeCompleteHttpDeps,
  handleCheckout,
  handlePracticeComplete,
} from './handlers';

export type {
  CheckoutBody,
  CheckoutHttpDeps,
  PaymentsHttpResponse,
  PracticeCompleteHttpDeps,
  WebhookHttpDeps,
} from './handlers';
export {
  handleCheckout,
  handlePracticeComplete,
  handleWebhook,
  readWebhookRawBody,
} from './handlers';

type ExpressCheckoutDeps = CheckoutHttpDeps | ((req: Request) => CheckoutHttpDeps);
type ExpressPracticeDeps = PracticeCompleteHttpDeps | ((req: Request) => PracticeCompleteHttpDeps);

function resolveCheckoutDeps(deps: ExpressCheckoutDeps, req: Request): CheckoutHttpDeps {
  return typeof deps === 'function' ? deps(req) : deps;
}

function resolvePracticeDeps(
  deps: ExpressPracticeDeps | undefined,
  req: Request,
): PracticeCompleteHttpDeps | undefined {
  if (!deps) return;
  return typeof deps === 'function' ? deps(req) : deps;
}

/** Mount on `/api` — checkout + optional practice complete; register webhook separately with `express.raw()`. */
export function createExpressPaymentsRouter(
  checkoutDeps: ExpressCheckoutDeps,
  practiceCompleteDeps?: ExpressPracticeDeps,
): Router {
  const router = createRouter();

  router.post('/checkout', async (req, res) => {
    sendHttpResponse(res, await handleCheckout(req.body, resolveCheckoutDeps(checkoutDeps, req)));
  });

  if (practiceCompleteDeps) {
    router.post('/checkout/practice/complete', async (req, res) => {
      const resolved = resolvePracticeDeps(practiceCompleteDeps, req);
      if (!resolved) {
        res.status(500).json({ error: 'Practice checkout is not configured.' });
        return;
      }
      sendHttpResponse(res, await handlePracticeComplete(req.body, resolved));
    });
  }

  return router;
}
