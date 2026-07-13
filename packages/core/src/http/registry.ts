import type { Schema } from 'effect';
import { HttpErrorBodySchema } from './response';

/** HTTP methods a registered route may use. */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * One registered endpoint's machine-checkable contract (ADR-0043): its method,
 * mounted path, and the Effect Schemas for its request body, success response,
 * and error envelope. The OpenAPI document and the typed client both derive from
 * the registry, so a route's contract is declared once and reused everywhere it
 * is served (`http/express.ts`, `http/next.ts`) or consumed (the frontend).
 */
export type RouteContract = {
  /** Stable id for docs + telemetry, e.g. `auth.signIn`. */
  readonly operationId: string;
  readonly method: HttpMethod;
  /** Path as mounted on the server, e.g. `/api/auth/signin`. */
  readonly path: string;
  /** One-line human summary for the OpenAPI operation. */
  readonly summary: string;
  /** Success status code — 200, or 201 for resource creation. */
  readonly successStatus: 200 | 201;
  /** Request body Schema; omitted for bodyless routes (GET, sign-out). */
  readonly request?: Schema.Schema.AnyNoContext;
  /** Success response body Schema. */
  readonly response: Schema.Schema.AnyNoContext;
  /** Error envelope Schema; defaults to the shared `{ code, error }` shape. */
  readonly error: Schema.Schema.AnyNoContext;
};

/** A route contract before defaults are applied — `error` and `successStatus` are optional. */
export type RouteContractInput = Omit<RouteContract, 'error' | 'successStatus'> & {
  /** Defaults to {@link HttpErrorBodySchema}. */
  readonly error?: Schema.Schema.AnyNoContext;
  /** Defaults to `200`. */
  readonly successStatus?: 200 | 201;
};

/**
 * Define one route contract, defaulting the error envelope to {@link HttpErrorBodySchema}.
 *
 * @param route - The route's method, path, ids, and I/O Schemas.
 * @returns The complete {@link RouteContract}.
 * @example
 * const signIn = defineRoute({
 *   operationId: 'auth.signIn',
 *   method: 'POST',
 *   path: '/api/auth/signin',
 *   summary: 'Sign in',
 *   request: SignInBodySchema,
 *   response: AuthUserSchema,
 * });
 */
export const defineRoute = (route: RouteContractInput): RouteContract => ({
  ...route,
  successStatus: route.successStatus ?? 200,
  error: route.error ?? HttpErrorBodySchema,
});

/**
 * Flatten route-contract groups from each domain into one registry.
 *
 * @param groups - Per-domain arrays of route contracts (auth, payments, …).
 * @returns The combined registry the OpenAPI + client derive from.
 * @example
 * const registry = createRegistry(AUTH_ROUTES, PAYMENTS_ROUTES);
 */
export const createRegistry = (
  ...groups: readonly (readonly RouteContract[])[]
): readonly RouteContract[] => groups.flat();
