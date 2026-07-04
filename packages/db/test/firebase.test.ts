import { Effect } from 'effect';
import { describe, expect, it, vi } from 'vitest';

const docStore = new Map<string, Record<string, unknown>>();

vi.mock('firebase-admin/app', () => ({
  getApps: () => [{ name: 'test' }],
  initializeApp: vi.fn(),
  cert: vi.fn((value) => value),
}));

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({
    collection: (name: string) => ({
      doc: (id: string) => ({
        set: async (data: Record<string, unknown>) => {
          docStore.set(`${name}:${id}`, data);
        },
        get: async () => ({
          exists: docStore.has(`${name}:${id}`),
          data: () => docStore.get(`${name}:${id}`),
        }),
        update: async (patch: Record<string, unknown>) => {
          const key = `${name}:${id}`;
          docStore.set(key, { ...docStore.get(key), ...patch });
        },
        delete: async () => {
          docStore.delete(`${name}:${id}`);
        },
      }),
      where: () => ({
        get: async () => ({ docs: [] }),
      }),
    }),
    listCollections: async () => [],
  }),
}));

import { createFirebaseDataProvider } from '@vybekiit/db/providers/firebase';

const run = Effect.runPromise;

describe('firebase data provider', () => {
  it('inserts and reads a record', async () => {
    docStore.clear();
    const provider = createFirebaseDataProvider({
      FIREBASE_PROJECT_ID: 'demo',
      FIREBASE_SERVICE_ACCOUNT_JSON: JSON.stringify({
        project_id: 'demo',
        client_email: 'x@demo.iam.gserviceaccount.com',
        private_key: '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n',
      }),
    });

    await run(provider.insert('users', { id: 'u1', email: 'u@test.com' }));

    const fetched = await run(provider.get<{ id: string; email: string }>('users', 'u1'));
    expect(fetched?.email).toBe('u@test.com');
  });
});
