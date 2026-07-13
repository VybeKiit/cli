import { defineRoute, type RouteContract } from '@vybekiit/core/http';
import { Schema } from 'effect';
import { CheckoutBodySchema } from './schemas';

/** Success body returned by checkout: the hosted redirect URL. */
export const CheckoutResponseSchema = Schema.Struct({ url: Schema.String });

/**
 * The payments HTTP contract (ADR-0043). Registers the frontend-facing checkout
 * route so it joins the generated OpenAPI document and typed client. The provider
 * webhook (`/api/webhook`) is a raw-body, signature-verified server callback — not
 * a frontend endpoint — and the practice-completion route is dev-only, so neither
 * belongs in the client contract.
 */
export const PAYMENTS_ROUTES: readonly RouteContract[] = [
  defineRoute({
    operationId: 'payments.checkout',
    method: 'POST',
    path: '/api/checkout',
    summary: 'Start a hosted checkout and return the redirect URL.',
    request: CheckoutBodySchema,
    response: CheckoutResponseSchema,
  }),
];
