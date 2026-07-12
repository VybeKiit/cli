# ADR-0043: API contract — Effect-Schema route registry → generated OpenAPI + typed client

## Status

Accepted — 2026-07-12

## Context

The frontend hand-asserts response shapes — `getJson<User>('/api/auth/me')` in
`templates/{mobile,extension}/src/lib/fetchJson.ts` — while the server validates only **request
bodies** (`packages/auth/src/http/schemas.ts`: `SignUpBodySchema` …). Responses are bare TypeScript
types (`AuthSession` in `session.ts`, `AuthUser` in `user.ts`); `toAuthSession` returns the type, not
a decoded value. Nothing links the shape the client assumes to the shape the server emits, so they
can drift silently. There is no OpenAPI document and no SDK.

Endpoints are already "generated" by the CLI (`backend add-route` / `add-crud` via the
`vybekiit:routes-import` / `vybekiit:routes-mount` markers, ADR-0016). "Ready for the frontend" should
therefore mean the generated endpoints carry a machine-checkable contract the frontend consumes — for
current **and** future routes, not a one-off spec. The kit already ships the **JSON client** and
**HTTP outcome** codes in `@vybekiit/core/http`, and mandates Effect `Schema` as the SSOT (ADR-0023),
which provides `JSONSchema` derivation out of the box.

## Decision

1. **Promote responses to Effect Schemas (SSOT).** `AuthSession`, `AuthUser`, and the `HTTP outcome`
   error envelope become `Schema.Struct`s; `toAuthSession` returns a decoded value. This alone closes
   the `getJson<User>` drift, because the client type is then *derived from* the server Schema.
2. **A MAINTAINED route registry in `@vybekiit/core/http`.** Each route registers
   `{ method, path, request, response, error }` Schemas. Auth and payments register theirs; CLI
   `backend add-route` / `add-crud` register theirs — so every current and future generated endpoint
   is in the registry.
3. **Derive, never hand-write.** The OpenAPI 3.1 document is generated from the registry via Effect
   `JSONSchema`; the typed frontend client is derived via `Schema.Type` and layered on the existing
   **JSON client** (`@vybekiit/core/http`) + the template `getJson<T>` / `fetchJson` seam. No
   OpenAPI-generator dependency (respects ADR-0034).
4. **One registry, both transports.** It backs `http/express.ts` (backend) and `http/next.ts` (web),
   so the contract is identical wherever a route is served.
5. **Owned artifacts, maintained derivation.** The emitted OpenAPI doc and typed-client module are
   OWNED generated files (like the routes); the derivation logic is MAINTAINED (ADR-0033 / ADR-0035).
   A CLI verb (e.g. `vybekiit backend gen-contract`) emits them.
6. **Verified against the server.** The endpoint contract test (ADR-0042) decodes live responses
   against the registry response Schemas, so the contract cannot drift from the running server.

## Consequences

- The frontend imports a generated, typed client instead of hand-asserting `getJson<User>`;
  client/server drift becomes a compile-time + test error.
- Adding a route through the CLI automatically extends the OpenAPI document and the client — the
  literal "built-in generated API endpoints for the frontend."
- Each route gains a small amount of response-Schema authoring, plus a generation step to emit the
  OpenAPI + client.
- Effect-native derivation keeps the toolchain dependency-free; we own a small OpenAPI emitter. If a
  richer client is later wanted, a generator library can consume the emitted OpenAPI without changing
  the SSOT.
