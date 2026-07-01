import { type MongoConfig, type Result, fail, ok } from '@vybekiit/core';
// `mongodb` is the official MongoDB driver. We target MongoDB Atlas — the managed
// cloud Mongo the agent's save-data skill provisions — reached via the SRV
// connection string in `MONGODB_URI`. Chosen over a thin REST wrapper because the
// driver pools connections internally and is the canonical, well-supported client.
import { type Collection, type Filter, MongoClient } from 'mongodb';
import type { DataProvider, DbRecord, QueryFilter } from '../../types';
import { MINIMAL_CAPABILITIES } from '../postgres/shared';

/**
 * Build the MongoDB (Atlas) {@link DataProvider} — the opt-in document backend a
 * buyer selects with `DATA_PROVIDER=mongodb` (ADR-0002).
 *
 * A single {@link MongoClient} is constructed here and reused across every call:
 * the driver pools connections internally, so one client per process is the
 * intended usage. Connecting is lazy (the driver dials on first operation), so the
 * factory stays synchronous and matches the other adapters' construction shape.
 *
 * Cross-provider contract note: VybeKiit records key off a plain string `id` field.
 * This adapter deliberately stores/reads `id` as a NORMAL document field and leaves
 * Mongo's own `_id` untouched, so the record shape is byte-for-byte identical to
 * what Supabase and DynamoDB return — a skill written against {@link DbRecord} never
 * sees a vendor-specific key. The auto-generated `_id` is projected/stripped out of
 * every returned document so the result matches {@link DbRecord} exactly.
 *
 * Each method maps a driver error into a {@link Result} failure with the same stable
 * codes the Supabase adapter uses, so callers branch on expected boundary errors
 * instead of catching thrown exceptions.
 */
export function createMongoDataProvider(config: MongoConfig): DataProvider {
  const client = new MongoClient(config.MONGODB_URI);
  const db = client.db(config.MONGODB_DB);

  /** Projection that drops Mongo's `_id` so returned docs match {@link DbRecord}. */
  const withoutMongoId = { projection: { _id: 0 } } as const;

  // Tables are buyer-defined at runtime (the save-data skill creates them), so no
  // compile-time schema exists. We type every collection against {@link DbRecord}
  // once here so method bodies stay record-typed and results narrow to `T` cleanly,
  // rather than wrestling the driver's generic `Document` per call.
  const records = (name: string): Collection<DbRecord> => db.collection<DbRecord>(name);

  return {
    name: 'mongodb',
    capabilities: MINIMAL_CAPABILITIES,

    async insert<T extends DbRecord>(collection: string, record: T): Promise<Result<T>> {
      try {
        await records(collection).insertOne({ ...record });
        return ok(record);
      } catch (error) {
        return fail('db_insert_failed', errorMessage(error));
      }
    },

    async get<T extends DbRecord>(collection: string, id: string): Promise<Result<T | null>> {
      try {
        // The `_id` projection makes the returned row match `T`; the driver still
        // types it as `WithId<DbRecord>`, so we narrow to `T` at this boundary.
        const doc = await records(collection).findOne({ id }, withoutMongoId);
        return ok((doc as T | null) ?? null);
      } catch (error) {
        return fail('db_get_failed', errorMessage(error));
      }
    },

    async query<T extends DbRecord>(
      collection: string,
      filter: QueryFilter<T>,
    ): Promise<Result<T[]>> {
      try {
        const docs = await records(collection)
          .find(filter as Filter<DbRecord>, withoutMongoId)
          .toArray();
        return ok(docs as T[]);
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
        const doc = await records(collection).findOneAndUpdate(
          { id },
          { $set: patch },
          { returnDocument: 'after', projection: { _id: 0 } },
        );
        if (!doc) return fail('db_update_failed', `No ${collection} record with id ${id}`);
        return ok(doc as T);
      } catch (error) {
        return fail('db_update_failed', errorMessage(error));
      }
    },

    async remove(collection: string, id: string): Promise<Result<true>> {
      try {
        await records(collection).deleteOne({ id });
        return ok(true);
      } catch (error) {
        return fail('db_remove_failed', errorMessage(error));
      }
    },
  };
}

/** Narrow an unknown caught value to a developer-facing message string. */
function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown MongoDB error';
}
