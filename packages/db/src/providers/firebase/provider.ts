import { readFileSync } from 'node:fs';
import type { FirebaseConfig } from '@vybekiit/core';
import { failDb, tryDb } from '@vybekiit/db/providerEffect';
import { MINIMAL_CAPABILITIES } from '@vybekiit/db/providers/postgres/shared';
import type { DataProvider, DbError, DbRecord, QueryFilter } from '@vybekiit/db/types';
import { Effect } from 'effect';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { type Firestore, getFirestore, type Query } from 'firebase-admin/firestore';
import { parseFirebaseServiceAccount } from './serviceAccountSchema';

/**
 * Load Firebase service-account credentials from config.
 *
 * @param config - Validated Firebase config.
 * @returns Parsed service-account credentials.
 * @throws When neither credential source is configured.
 * @example
 * const credentials = loadServiceAccount(config);
 */
const loadServiceAccount = (config: FirebaseConfig): Record<string, unknown> => {
  if (config.FIREBASE_SERVICE_ACCOUNT_JSON !== undefined) {
    return parseFirebaseServiceAccount(JSON.parse(config.FIREBASE_SERVICE_ACCOUNT_JSON));
  }
  if (config.GOOGLE_APPLICATION_CREDENTIALS !== undefined) {
    return parseFirebaseServiceAccount(
      JSON.parse(readFileSync(config.GOOGLE_APPLICATION_CREDENTIALS, 'utf8')),
    );
  }
  throw new Error('Firebase credentials missing');
};

/**
 * Resolve the process-wide Firestore client.
 *
 * @param config - Validated Firebase config.
 * @returns Firestore client.
 * @example
 * const firestore = resolveFirestore(config);
 */
const resolveFirestore = (config: FirebaseConfig): Firestore => {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert(loadServiceAccount(config) as Parameters<typeof cert>[0]),
      projectId: config.FIREBASE_PROJECT_ID,
    });
  }
  return getFirestore();
};

/**
 * Build the Firebase Firestore {@link DataProvider} — opt-in via
 * `DATA_PROVIDER=firebase` (ADR-0002).
 *
 * @param config - Validated Firebase config.
 * @returns Data provider backed by Firestore.
 * @example
 * const provider = createFirebaseDataProvider(config);
 */
export const createFirebaseDataProvider =
  // biome-ignore lint/complexity/noExcessiveLinesPerFunction: Adapter methods stay colocated with shared Firestore client state.
  (config: FirebaseConfig): DataProvider => {
    const db = resolveFirestore(config);

    return {
      name: 'firebase',
      capabilities: MINIMAL_CAPABILITIES,

      insert: <T extends DbRecord>(collection: string, record: T) =>
        tryDb(
          'db_insert_failed',
          async () => {
            const id = record.id.length === 0 ? crypto.randomUUID() : record.id;
            const stored = { ...record, id };
            await db.collection(collection).doc(id).set(stored);
            return stored as T;
          },
          'unknown Firebase error',
        ),

      get: <T extends DbRecord>(collection: string, id: string) =>
        tryDb(
          'db_get_failed',
          async () => {
            const snap = await db.collection(collection).doc(id).get();
            if (!snap.exists) {
              return null;
            }
            return snap.data() as T;
          },
          'unknown Firebase error',
        ),

      query: <T extends DbRecord>(collection: string, filter: QueryFilter<T>) =>
        tryDb(
          'db_query_failed',
          async () => {
            let ref: Query = db.collection(collection);
            for (const [key, value] of Object.entries(filter)) {
              ref = ref.where(key, '==', value);
            }
            const snap = await ref.get();
            return snap.docs.map((doc) => doc.data() as T);
          },
          'unknown Firebase error',
        ),

      update: <T extends DbRecord>(collection: string, id: string, patch: Partial<Omit<T, 'id'>>) =>
        Effect.gen(function* () {
          const docRef = db.collection(collection).doc(id);
          const snap = yield* tryDb(
            'db_update_failed',
            () => docRef.get(),
            'unknown Firebase error',
          );
          if (!snap.exists) {
            return yield* failDb('not_found', `No record ${id} in ${collection}.`);
          }
          yield* tryDb(
            'db_update_failed',
            () => docRef.update(patch as Record<string, unknown>),
            'unknown Firebase error',
          );
          const updated = yield* tryDb(
            'db_update_failed',
            () => docRef.get(),
            'unknown Firebase error',
          );
          return updated.data() as T;
        }),

      remove: (collection: string, id: string) =>
        Effect.gen(function* () {
          const docRef = db.collection(collection).doc(id);
          const snap = yield* tryDb(
            'db_remove_failed',
            () => docRef.get(),
            'unknown Firebase error',
          );
          if (!snap.exists) {
            return yield* failDb('not_found', `No record ${id} in ${collection}.`);
          }
          yield* tryDb('db_remove_failed', () => docRef.delete(), 'unknown Firebase error');
          return true as const;
        }),
    };
  };

/**
 * Probe Firestore connectivity.
 *
 * @param config - Validated Firebase config.
 * @returns An Effect that succeeds when Firestore lists collections.
 * @example
 * const result = await Effect.runPromise(pingFirebaseDatabase(config));
 */
export const pingFirebaseDatabase = (config: FirebaseConfig): Effect.Effect<true, DbError> =>
  tryDb(
    'db_unreachable',
    async () => {
      const db = resolveFirestore(config);
      await db.listCollections();
      return true as const;
    },
    'unknown Firebase error',
  );
