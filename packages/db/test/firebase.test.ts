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

import { createFirebaseDataProvider } from '../src/providers/firebase/index';

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

    const inserted = await provider.insert('users', { id: 'u1', email: 'u@test.com' });
    expect(inserted.ok).toBe(true);

    const fetched = await provider.get<{ id: string; email: string }>('users', 'u1');
    expect(fetched.ok).toBe(true);
    if (fetched.ok) {
      expect(fetched.value?.email).toBe('u@test.com');
    }
  });
});
