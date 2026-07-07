import { decodeJsonBody } from '@vybekiit/core/http';
import { sendHttpResponse } from '@vybekiit/core/http/express';
import type { Request, Router } from 'express';
import { Router as createRouter } from 'express';
import {
  type CheckoutHttpDeps,
  handleCheckout,
  handlePracticeComplete,
  type PracticeCompleteHttpDeps,
} from './handlers';
import { CheckoutBodySchema, PracticeCompleteBodySchema } from './schemas';

type ExpressCheckoutDeps = CheckoutHttpDeps | ((req: Request) => CheckoutHttpDeps);
type ExpressPracticeDeps = PracticeCompleteHttpDeps | ((req: Request) => PracticeCompleteHttpDeps);

/**
 * Resolve checkout dependencies from either a static object or request-aware factory.
 *
 * @param deps - Checkout dependencies or a factory that derives them from the request.
 * @param req - Express request passed to dependency factories.
 * @returns Checkout dependencies for the current request.
 * @example
 * const deps = resolveCheckoutDeps(staticDeps, req);
 */
const resolveCheckoutDeps = (deps: ExpressCheckoutDeps, req: Request): CheckoutHttpDeps => {
  if (typeof deps === 'function') {
    return deps(req);
  }

  return deps;
};

/**
 * Resolve optional practice completion dependencies from static or request-aware input.
 *
 * @param deps - Optional practice dependencies or factory.
 * @param req - Express request passed to dependency factories.
 * @returns Practice dependencies for the current request, or `undefined` when absent.
 * @example
 * const deps = resolvePracticeDeps(practiceDeps, req);
 */
const resolvePracticeDeps = (
  deps: ExpressPracticeDeps | undefined,
  req: Request,
): PracticeCompleteHttpDeps | undefined => {
  if (deps === undefined) {
    return;
  }

  if (typeof deps === 'function') {
    return deps(req);
  }

  return deps;
};

/**
 * Create the Express router for checkout and optional practice completion routes.
 *
 * @param checkoutDeps - Static or request-aware dependencies for checkout handling.
 * @param practiceCompleteDeps - Optional static or request-aware practice completion dependencies.
 * @returns An Express router mounted by the host app.
 * @example
 * app.use('/api', createExpressPaymentsRouter(checkoutDeps, practiceDeps));
 */
export const createExpressPaymentsRouter = (
  checkoutDeps: ExpressCheckoutDeps,
  practiceCompleteDeps?: ExpressPracticeDeps,
): Router => {
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

  if (practiceCompleteDeps !== undefined) {
    router.post('/checkout/practice/complete', async (req, res) => {
      const resolved = resolvePracticeDeps(practiceCompleteDeps, req);
      if (resolved === undefined) {
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
};
