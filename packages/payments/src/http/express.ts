import { decodeJsonBody } from '@vybekiit/core/http';
import { sendHttpResponse } from '@vybekiit/core/http/express';
import type { Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';
import {
  type CheckoutHttpDeps,
  handleCheckout,
  handlePracticeComplete,
  type PracticeCompleteHttpDeps,
} from './handlers';
import { CheckoutBodySchema, PracticeCompleteBodySchema } from './schemas';

export type {
  CheckoutBody,
  CheckoutHttpDeps,
  PaymentsHttpResponse,
  PracticeCompleteHttpDeps,
  WebhookHttpDeps,
} from './handlers';
export {
  CheckoutBodySchema,
  handleCheckout,
  handlePracticeComplete,
  handleWebhook,
  PracticeCompleteBodySchema,
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
    const parsed = decodeJsonBody(req.body, CheckoutBodySchema, 'productId is required.');
    if (!parsed.ok) {
      sendHttpResponse(res, parsed.response);
      return;
    }
    sendHttpResponse(
      res,
      await handleCheckout(parsed.body, resolveCheckoutDeps(checkoutDeps, req)),
    );
  });

  if (practiceCompleteDeps) {
    router.post('/checkout/practice/complete', async (req, res) => {
      const resolved = resolvePracticeDeps(practiceCompleteDeps, req);
      if (!resolved) {
        res.status(500).json({ error: 'Practice checkout is not configured.' });
        return;
      }
      const parsed = decodeJsonBody(req.body, PracticeCompleteBodySchema, 'productId is required.');
      if (!parsed.ok) {
        sendHttpResponse(res, parsed.response);
        return;
      }
      sendHttpResponse(res, await handlePracticeComplete(parsed.body, resolved));
    });
  }

  return router;
}
