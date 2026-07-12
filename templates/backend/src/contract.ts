import { AUTH_ROUTES } from '@vybekiit/auth/http';
import { createRegistry, type OpenApiDocument, toOpenApiDocument } from '@vybekiit/core/http';
import { PAYMENTS_ROUTES } from '@vybekiit/payments/http';

/**
 * This backend's API contract (ADR-0043): every generated endpoint the frontend
 * consumes, as one route registry. Auth and payments register their routes; when
 * you add a route that exposes a JSON contract, append its `RouteContract` here so
 * it joins the generated OpenAPI document (`pnpm gen:contract`) and the typed client.
 */
export const APP_ROUTES = createRegistry(AUTH_ROUTES, PAYMENTS_ROUTES);

/**
 * Build the OpenAPI 3.1 document for this backend's routes.
 *
 * @param info - Document title and version (typically this package's name + version).
 * @returns The generated OpenAPI 3.1 document.
 * @example
 * const doc = buildOpenApiDocument({ title: 'my-vybekiit-backend', version: '0.1.0' });
 */
export const buildOpenApiDocument = (info: {
  readonly title: string;
  readonly version: string;
}): OpenApiDocument => toOpenApiDocument(APP_ROUTES, info);
