import { JSONSchema, type Schema } from 'effect';
import type { RouteContract } from './registry';

/** Info block for the emitted OpenAPI document. */
export type OpenApiInfo = {
  readonly title: string;
  readonly version: string;
  readonly description?: string;
};

/** The minimal shape of the emitted OpenAPI 3.1 document. */
export type OpenApiDocument = {
  readonly openapi: '3.1.0';
  readonly info: Record<string, unknown>;
  readonly paths: Record<string, Record<string, unknown>>;
};

/** Keys of Effect's JSON Schema output that OpenAPI 3.1 does not use. */
const OMITTED_SCHEMA_KEYS = new Set(['$schema']);

/**
 * Derive an OpenAPI-ready JSON Schema for one route Schema.
 *
 * Effect's `JSONSchema.make` emits a self-contained draft-07 object; OpenAPI 3.1
 * uses JSON Schema 2020-12, so we drop the draft-07 `$schema` marker and keep the
 * rest (which is already valid 3.1).
 *
 * @param schema - The route's request, response, or error Schema.
 * @returns A JSON Schema object safe to embed in an OpenAPI operation.
 */
const jsonSchemaFor = (schema: Schema.Schema.AnyNoContext): Record<string, unknown> => {
  const made = JSONSchema.make(schema);
  return Object.fromEntries(Object.entries(made).filter(([key]) => !OMITTED_SCHEMA_KEYS.has(key)));
};

/** `application/json` content block wrapping one schema. */
const jsonContent = (schema: Schema.Schema.AnyNoContext): Record<string, unknown> => ({
  'application/json': { schema: jsonSchemaFor(schema) },
});

/** Build the OpenAPI operation object for one route. */
const operationFor = (route: RouteContract): Record<string, unknown> => {
  const operation: Record<string, unknown> = {
    operationId: route.operationId,
    summary: route.summary,
    tags: [route.operationId.split('.')[0]],
    responses: {
      [String(route.successStatus)]: {
        description: 'Success.',
        content: jsonContent(route.response),
      },
      default: {
        description: 'Error — a `{ code, error }` envelope.',
        content: jsonContent(route.error),
      },
    },
  };
  if (route.request !== undefined) {
    operation.requestBody = { required: true, content: jsonContent(route.request) };
  }
  return operation;
};

/**
 * Derive an OpenAPI 3.1 document from a route registry (ADR-0043).
 *
 * The document is generated, never hand-written: each {@link RouteContract}
 * becomes a path + operation whose request/response/error schemas come straight
 * from the registry's Effect Schemas via `JSONSchema`, so the spec cannot drift
 * from the contract the server enforces. No OpenAPI-generator dependency (ADR-0034).
 *
 * @param registry - The registered routes, e.g. `createRegistry(AUTH_ROUTES, PAYMENTS_ROUTES)`.
 * @param info - Document title, version, and optional description.
 * @returns The OpenAPI 3.1 document as a plain, JSON-serializable object.
 * @example
 * const doc = toOpenApiDocument(AUTH_ROUTES, { title: 'VybeKiit API', version: '1.0.0' });
 */
export const toOpenApiDocument = (
  registry: readonly RouteContract[],
  info: OpenApiInfo,
): OpenApiDocument => {
  const paths: Record<string, Record<string, unknown>> = {};
  for (const route of registry) {
    const pathItem = paths[route.path] ?? {};
    pathItem[route.method.toLowerCase()] = operationFor(route);
    paths[route.path] = pathItem;
  }

  return {
    openapi: '3.1.0',
    info: {
      title: info.title,
      version: info.version,
      ...(info.description === undefined ? {} : { description: info.description }),
    },
    paths,
  };
};
