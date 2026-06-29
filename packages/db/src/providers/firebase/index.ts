import { readFileSync } from 'node:fs';
import { type FirebaseConfig, type Result, fail, ok } from '@vybekiit/core';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore, type Query } from 'firebase-admin/firestore';
import type { DataProvider, DbRecord, QueryFilter } from '../../types';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function loadServiceAccount(config: FirebaseConfig): Record<string, unknown> {
  if (config.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(config.FIREBASE_SERVICE_ACCOUNT_JSON);
  }
  if (config.GOOGLE_APPLICATION_CREDENTIALS) {
    return JSON.parse(readFileSync(config.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
  }
  throw new Error('Firebase credentials missing');
}

function resolveFirestore(config: FirebaseConfig): Firestore {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert(loadServiceAccount(config) as Parameters<typeof cert>[0]),
      projectId: config.FIREBASE_PROJECT_ID,
    });
  }
  return getFirestore();
}

/**
 * Build the Firebase Firestore {@link DataProvider} — opt-in via
 * `DATA_PROVIDER=firebase` (ADR-0002).
 */
export function createFirebaseDataProvider(config: FirebaseConfig): DataProvider {
  const db = resolveFirestore(config);

  return {
    name: 'firebase',

    async insert<T extends DbRecord>(collection: string, record: T): Promise<Result<T>> {
      try {
        const id = record.id || crypto.randomUUID();
        const stored = { ...record, id };
        await db.collection(collection).doc(id).set(stored);
        return ok(stored as T);
      } catch (error) {
        return fail('db_insert_failed', errorMessage(error));
      }
    },

    async get<T extends DbRecord>(collection: string, id: string): Promise<Result<T | null>> {
      try {
        const snap = await db.collection(collection).doc(id).get();
        if (!snap.exists) return ok(null);
        return ok(snap.data() as T);
      } catch (error) {
        return fail('db_get_failed', errorMessage(error));
      }
    },

    async query<T extends DbRecord>(
      collection: string,
      filter: QueryFilter<T>,
    ): Promise<Result<T[]>> {
      try {
        let ref: Query = db.collection(collection);
        for (const [key, value] of Object.entries(filter)) {
          ref = ref.where(key, '==', value);
        }
        const snap = await ref.get();
        return ok(snap.docs.map((doc) => doc.data() as T));
      } catch (error) {
        return fail('db_query_failed', errorMessage(error));
      }
    },

    async update<T extends DbRecord>(
      collection: string,
      id: string,
      patch: Partial<Omit<T, 'id'>>,
    ): Promise<Result<T>> {
      try {
        const docRef = db.collection(collection).doc(id);
        const snap = await docRef.get();
        if (!snap.exists) {
          return fail('not_found', `No record ${id} in ${collection}.`);
        }
        await docRef.update(patch as Record<string, unknown>);
        const updated = await docRef.get();
        return ok(updated.data() as T);
      } catch (error) {
        return fail('db_update_failed', errorMessage(error));
      }
    },

    async remove(collection: string, id: string): Promise<Result<true>> {
      try {
        const docRef = db.collection(collection).doc(id);
        const snap = await docRef.get();
        if (!snap.exists) {
          return fail('not_found', `No record ${id} in ${collection}.`);
        }
        await docRef.delete();
        return ok(true);
      } catch (error) {
        return fail('db_remove_failed', errorMessage(error));
      }
    },
  };
}

/** Firestore connectivity probe. */
export async function pingFirebaseDatabase(config: FirebaseConfig): Promise<Result<true>> {
  try {
    const db = resolveFirestore(config);
    await db.listCollections();
    return ok(true);
  } catch (error) {
    return fail('db_unreachable', errorMessage(error));
  }
}
