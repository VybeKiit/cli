import { Schema } from 'effect';
import { describe, expect, it } from 'vitest';
import { toOpenApiDocument } from './openapi';
import { defineRoute } from './registry';

const UserSchema = Schema.Struct({ id: Schema.String });
const AckSchema = Schema.Struct({ ok: Schema.Literal(true) });
const CreateBodySchema = Schema.Struct({ name: Schema.String });

const REGISTRY = [
  defineRoute({
    operationId: 'demo.create',
    method: 'POST',
    path: '/api/demo',
    summary: 'Create a demo.',
    successStatus: 201,
    request: CreateBodySchema,
    response: UserSchema,
  }),
  defineRoute({
    operationId: 'demo.get',
    method: 'GET',
    path: '/api/demo',
    summary: 'Get the demo.',
    response: UserSchema,
  }),
  defineRoute({
    operationId: 'demo.ping',
    method: 'POST',
    path: '/api/demo/ping',
    summary: 'Ping.',
    response: AckSchema,
  }),
];

describe('toOpenApiDocument', () => {
  const doc = toOpenApiDocument(REGISTRY, { title: 'Demo API', version: '1.2.3' });

  it('emits a generated OpenAPI 3.1 document from the registry', () => {
    expect(doc).toMatchObject({
      openapi: '3.1.0',
      info: { title: 'Demo API', version: '1.2.3' },
      paths: {
        '/api/demo': {
          post: {
            operationId: 'demo.create',
            tags: ['demo'],
            requestBody: {
              required: true,
              content: { 'application/json': { schema: { type: 'object', required: ['name'] } } },
            },
            responses: {
              '201': { content: { 'application/json': { schema: { type: 'object' } } } },
              default: {
                content: {
                  'application/json': {
                    schema: {
                      properties: { code: { enum: expect.arrayContaining(['unauthorized']) } },
                    },
                  },
                },
              },
            },
          },
          get: { operationId: 'demo.get' },
        },
        '/api/demo/ping': { post: { operationId: 'demo.ping', responses: { '200': {} } } },
      },
    });
  });

  it('strips the draft-07 marker and omits request bodies for bodyless routes', () => {
    const serialized = JSON.stringify(doc);
    expect(serialized).not.toContain('$schema');
    // Only the POST create route declares a body; the GET and ping routes omit it.
    expect(serialized.match(/"requestBody"/g)).toHaveLength(1);
  });
});
